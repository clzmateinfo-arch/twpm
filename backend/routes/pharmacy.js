const express = require('express');
const router = express.Router();
const Drug = require('../models/Drug');
const Patient = require('../models/Patient');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { getNextSequence } = require('../models/Counter');
const { sendAlertEmail } = require('../mailer');
const authMiddleware = require('../middleware/auth');

const EXPIRY_WARNING_DAYS = 30;

router.use(authMiddleware);

const addLog = async (req, action, details) => {
    const userId = req.user?.id || req.headers['x-user-id'] || 'SYSTEM';
    const userName = req.user?.name || req.headers['x-user-name'] || 'System User';

    await AuditLog.create({
        id: `L${Date.now()}`,
        timestamp: new Date(),
        userId,
        userName,
        action,
        details
    });
};

// Re-checks User.active per-request. Unlike the rest of this app (where a
// deactivated user's still-valid JWT is only rejected at next login), a
// dispense/catalog action is treated as high-stakes enough to warrant this
// extra query on every request.
const requireActiveUser = (logAction) => async (req, res, next) => {
    try {
        const user = await User.findOne({ id: req.user?.id });
        if (!user || !user.active) {
            if (logAction) await addLog(req, logAction, `Rejected: account deactivated or not found (userId=${req.user?.id})`);
            return res.status(401).json({ error: 'Account has been deactivated' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const pharmacistOnly = (logAction) => async (req, res, next) => {
    if (req.user && req.user.role === 'PHARMACIST') return next();
    if (logAction) await addLog(req, logAction, `Rejected: role '${req.user?.role}' attempted a pharmacist-only action`);
    return res.status(403).json({ error: 'Requires Pharmacist privileges' });
};

const pharmacistOrAdmin = (req, res, next) => {
    if (req.user && ['PHARMACIST', 'ADMIN'].includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Requires Pharmacist or Admin privileges' });
};

const catalogViewer = (req, res, next) => {
    if (req.user && ['DOCTOR', 'PHARMACIST', 'ADMIN'].includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Insufficient privileges to view the drug catalog' });
};

const computeDedupeKey = (name, form, strength) =>
    `${String(name).trim().toLowerCase()}|${form}|${String(strength).trim().toLowerCase()}`;

const isExpiredOrNearExpiry = (drug, warningDays = EXPIRY_WARNING_DAYS) => {
    const warnDate = new Date(Date.now() + warningDays * 24 * 60 * 60 * 1000);
    return drug.expiryDate <= warnDate;
};

// Request-triggered alerts intentionally have NO dedup/crossing-detection,
// mirroring the existing WARD_CAPACITY_WARNING behavior in routes/index.js
// (verified: it fires unconditionally on every qualifying admission, not
// just once on crossing the threshold).
const checkAndAlertLowStock = async (req, drug) => {
    if (drug.stock <= drug.reorderThreshold) {
        req.io.emit('DRUG_LOW_STOCK', drug);
        sendAlertEmail(
            `Low Stock Alert: ${drug.name} (${drug.strength})`,
            `Drug ${drug.name} ${drug.form} ${drug.strength} is at ${drug.stock} unit(s), at or below the reorder threshold of ${drug.reorderThreshold}.`
        );
    }
};

const checkAndAlertExpiry = async (req, drug) => {
    if (isExpiredOrNearExpiry(drug)) {
        const expired = drug.expiryDate < new Date();
        req.io.emit('DRUG_EXPIRY_WARNING', drug);
        sendAlertEmail(
            `${expired ? 'Expired Drug' : 'Expiry Warning'}: ${drug.name} (${drug.strength})`,
            `Drug ${drug.name} ${drug.form} ${drug.strength} ${expired ? 'expired on' : 'expires on'} ${drug.expiryDate.toDateString()}.`
        );
    }
};

// Periodic job (called from server.js on boot + every 6h). Unlike the
// request-triggered checks above, this DOES dedup to once/calendar-day via
// lastExpiryAlertDate — a 6-hourly unthrottled job would otherwise send up
// to 4 emails/day per expiring drug, a risk the request-triggered path
// doesn't have since it only fires on actual create/update/dispense events.
const runExpiryCheck = async (io) => {
    const drugs = await Drug.find({ active: true });
    const now = new Date();
    const todayStr = now.toDateString();

    for (const drug of drugs) {
        if (!isExpiredOrNearExpiry(drug)) continue;
        const alreadyAlertedToday = drug.lastExpiryAlertDate && drug.lastExpiryAlertDate.toDateString() === todayStr;
        if (alreadyAlertedToday) continue;

        const expired = drug.expiryDate < now;
        io.emit('DRUG_EXPIRY_WARNING', drug);
        sendAlertEmail(
            `${expired ? 'Expired Drug' : 'Expiry Warning'}: ${drug.name} (${drug.strength})`,
            `Drug ${drug.name} ${drug.form} ${drug.strength} ${expired ? 'expired on' : 'expires on'} ${drug.expiryDate.toDateString()}.`
        );
        drug.lastExpiryAlertDate = now;
        await drug.save();
    }
};

// ---- Drug catalog CRUD ----

// Returns ALL drugs (active + inactive), matching GET /api/users' existing
// convention of returning every record with an active/inactive flag rather
// than hiding deactivated ones. The doctor's prescribe dropdown filters to
// active===true client-side (a deactivated drug should never be
// prescribable, but the pharmacist's catalog view needs to see it for
// audit/history purposes).
router.get('/drugs', requireActiveUser(), catalogViewer, async (req, res) => {
    try {
        const drugs = await Drug.find().sort({ name: 1 });
        res.json(drugs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/drugs', requireActiveUser(), pharmacistOrAdmin, async (req, res) => {
    try {
        const { name, form, strength, unit, stock, reorderThreshold, expiryDate } = req.body;

        if (!name || !form || !strength || !unit || !expiryDate) {
            return res.status(400).json({ error: 'name, form, strength, unit and expiryDate are required' });
        }
        if (!Drug.FORMS.includes(form)) {
            return res.status(400).json({ error: `Invalid form. Must be one of: ${Drug.FORMS.join(', ')}` });
        }
        if (!Drug.UNITS.includes(unit)) {
            return res.status(400).json({ error: `Invalid unit. Must be one of: ${Drug.UNITS.join(', ')}` });
        }

        const parsedExpiry = new Date(expiryDate);
        if (isNaN(parsedExpiry.getTime())) {
            return res.status(400).json({ error: 'Invalid expiryDate' });
        }

        const stockVal = stock === undefined ? 0 : Number(stock);
        const reorderVal = reorderThreshold === undefined ? 10 : Number(reorderThreshold);
        if (!Number.isFinite(stockVal) || stockVal < 0) {
            return res.status(400).json({ error: 'stock must be a non-negative number' });
        }
        if (!Number.isFinite(reorderVal) || reorderVal < 0) {
            return res.status(400).json({ error: 'reorderThreshold must be a non-negative number' });
        }

        const dedupeKey = computeDedupeKey(name, form, strength);
        const existing = await Drug.findOne({ dedupeKey, active: true });
        if (existing) {
            return res.status(400).json({ error: `An active drug with this name, form and strength already exists (${existing.id})` });
        }

        const seq = await getNextSequence('drugId');
        const drug = new Drug({
            id: `D${seq.toString().padStart(4, '0')}`,
            name,
            form,
            strength,
            unit,
            stock: stockVal,
            reorderThreshold: reorderVal,
            expiryDate: parsedExpiry
        });
        await drug.save();

        await addLog(req, 'DRUG_CREATED', `Created drug ${drug.name} ${drug.strength} (${drug.id})`);
        req.io.emit('DRUG_UPDATED', drug);
        await checkAndAlertLowStock(req, drug);
        await checkAndAlertExpiry(req, drug);

        res.json(drug);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'An active drug with this name, form and strength already exists' });
        if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
        res.status(500).json({ error: err.message });
    }
});

router.put('/drugs/:id', requireActiveUser(), pharmacistOrAdmin, async (req, res) => {
    try {
        const drug = await Drug.findOne({ id: req.params.id });
        if (!drug) return res.status(404).json({ error: 'Drug not found' });

        const { name, form, strength, unit, stock, reorderThreshold, expiryDate } = req.body;

        if (form !== undefined && !Drug.FORMS.includes(form)) {
            return res.status(400).json({ error: `Invalid form. Must be one of: ${Drug.FORMS.join(', ')}` });
        }
        if (unit !== undefined && !Drug.UNITS.includes(unit)) {
            return res.status(400).json({ error: `Invalid unit. Must be one of: ${Drug.UNITS.join(', ')}` });
        }

        const nextName = name !== undefined ? name : drug.name;
        const nextForm = form !== undefined ? form : drug.form;
        const nextStrength = strength !== undefined ? strength : drug.strength;
        const identityChanged = nextName !== drug.name || nextForm !== drug.form || nextStrength !== drug.strength;

        if (identityChanged) {
            const dedupeKey = computeDedupeKey(nextName, nextForm, nextStrength);
            const existing = await Drug.findOne({ dedupeKey, active: true, id: { $ne: drug.id } });
            if (existing) {
                return res.status(400).json({ error: `An active drug with this name, form and strength already exists (${existing.id})` });
            }
        }

        if (stock !== undefined) {
            const stockVal = Number(stock);
            if (!Number.isFinite(stockVal) || stockVal < 0) {
                return res.status(400).json({ error: 'stock must be a non-negative number' });
            }
            drug.stock = stockVal;
        }
        if (reorderThreshold !== undefined) {
            const reorderVal = Number(reorderThreshold);
            if (!Number.isFinite(reorderVal) || reorderVal < 0) {
                return res.status(400).json({ error: 'reorderThreshold must be a non-negative number' });
            }
            drug.reorderThreshold = reorderVal;
        }
        if (expiryDate !== undefined) {
            const parsedExpiry = new Date(expiryDate);
            if (isNaN(parsedExpiry.getTime())) return res.status(400).json({ error: 'Invalid expiryDate' });
            drug.expiryDate = parsedExpiry;
        }
        if (name !== undefined) drug.name = name;
        if (form !== undefined) drug.form = form;
        if (strength !== undefined) drug.strength = strength;
        if (unit !== undefined) drug.unit = unit;

        await drug.save();

        await addLog(req, 'DRUG_UPDATED', `Updated drug ${drug.name} ${drug.strength} (${drug.id})`);
        req.io.emit('DRUG_UPDATED', drug);
        await checkAndAlertLowStock(req, drug);
        await checkAndAlertExpiry(req, drug);

        res.json(drug);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'An active drug with this name, form and strength already exists' });
        if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
        res.status(500).json({ error: err.message });
    }
});

router.delete('/drugs/:id', requireActiveUser(), pharmacistOrAdmin, async (req, res) => {
    try {
        const drug = await Drug.findOneAndUpdate({ id: req.params.id }, { active: false }, { new: true });
        if (!drug) return res.status(404).json({ error: 'Drug not found' });

        await addLog(req, 'DRUG_DEACTIVATED', `Deactivated drug ${drug.name} ${drug.strength} (${drug.id})`);
        req.io.emit('DRUG_UPDATED', drug);
        res.json({ success: true, message: 'Drug deactivated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- Dispense (prescription-linked only) ----
// Every branch below — success or rejection — writes an audit log entry.
// This deliberately deviates from the rest of this codebase (which only
// logs successful actions), scoped to this endpoint alone, per explicit
// requirement given dispensing's medication-accountability stakes.
router.post('/dispense', requireActiveUser('MEDICATION_DISPENSE_REJECTED'), pharmacistOnly('MEDICATION_DISPENSE_REJECTED'), async (req, res) => {
    try {
        const { patientId, medicationId, drugId, quantity: rawQuantity } = req.body;

        if (!patientId || !medicationId || !drugId || rawQuantity === undefined || rawQuantity === null) {
            await addLog(req, 'MEDICATION_DISPENSE_REJECTED', 'Rejected: missing required fields (patientId, medicationId, drugId, quantity)');
            return res.status(400).json({ error: 'patientId, medicationId, drugId and quantity are required' });
        }

        const quantity = typeof rawQuantity === 'string' ? Number(rawQuantity) : rawQuantity;
        if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) {
            await addLog(req, 'MEDICATION_DISPENSE_REJECTED', `Rejected: invalid quantity '${rawQuantity}' for patient ${patientId}`);
            return res.status(400).json({ error: 'quantity must be a positive number' });
        }

        const drug = await Drug.findOne({ id: drugId });
        if (!drug || !drug.active) {
            await addLog(req, 'MEDICATION_DISPENSE_REJECTED', `Rejected: drug ${drugId} not found or inactive`);
            return res.status(404).json({ error: 'Drug not found or is inactive' });
        }

        if (!Drug.isFractionalUnit(drug.unit) && !Number.isInteger(quantity)) {
            await addLog(req, 'MEDICATION_DISPENSE_REJECTED', `Rejected: fractional quantity ${quantity} invalid for unit '${drug.unit}' (drug ${drug.id})`);
            return res.status(400).json({ error: `quantity must be a whole number for unit '${drug.unit}'` });
        }

        if (drug.expiryDate < new Date()) {
            await addLog(req, 'MEDICATION_DISPENSE_REJECTED', `Rejected: drug ${drug.name} (${drug.id}) is expired (expired ${drug.expiryDate.toDateString()})`);
            return res.status(400).json({ error: `Cannot dispense expired drug (expired on ${drug.expiryDate.toDateString()})` });
        }

        const patient = await Patient.findOne({ id: patientId });
        if (!patient) {
            await addLog(req, 'MEDICATION_DISPENSE_REJECTED', `Rejected: patient ${patientId} not found`);
            return res.status(404).json({ error: 'Patient not found' });
        }

        const med = patient.treatmentPlan?.medications?.id(medicationId);
        if (!med || !med.drugId || med.drugId !== drugId || med.quantityPrescribed == null) {
            await addLog(req, 'MEDICATION_DISPENSE_REJECTED', `Rejected: medication line ${medicationId} for patient ${patientId} not found or not linked to drug ${drugId}`);
            return res.status(400).json({ error: 'No matching prescription line found for this drug, or it is not linked to pharmacy inventory' });
        }

        if (med.status === 'FULFILLED') {
            await addLog(req, 'MEDICATION_DISPENSE_REJECTED', `Rejected: medication line ${medicationId} for patient ${patientId} already fully dispensed`);
            return res.status(400).json({ error: 'This medication has already been fully dispensed' });
        }

        const remaining = med.quantityPrescribed - med.dispensedQuantity;
        if (quantity > remaining) {
            await addLog(req, 'MEDICATION_DISPENSE_REJECTED', `Rejected: requested ${quantity} exceeds remaining ${remaining} for patient ${patientId}, medication ${medicationId}`);
            return res.status(400).json({ error: `Requested quantity exceeds remaining prescribed amount (remaining: ${remaining})` });
        }

        // Atomic decrement — the filter and the $inc are evaluated as a single
        // MongoDB document operation, so no concurrent request can observe
        // stock>=quantity as true against a value another in-flight dispense
        // has already consumed. This is what actually prevents negative stock
        // under concurrency (a separate read-then-write would NOT be safe).
        const updatedDrug = await Drug.findOneAndUpdate(
            { id: drugId, active: true, expiryDate: { $gte: new Date() }, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { new: true }
        );

        if (!updatedDrug) {
            const current = await Drug.findOne({ id: drugId });
            let reason, status;
            if (!current || !current.active) { reason = 'Drug is no longer available'; status = 404; }
            else if (current.expiryDate < new Date()) { reason = 'Drug expired'; status = 400; }
            else { reason = `Insufficient stock: only ${current.stock} available`; status = 409; }
            await addLog(req, 'MEDICATION_DISPENSE_REJECTED', `Rejected: ${reason} for drug ${drugId}, patient ${patientId} (resolved at atomic update)`);
            return res.status(status).json({ error: reason });
        }

        // Second, lower-stakes race: two pharmacists dispensing against the
        // SAME medication line. Guarded with an optimistic-concurrency
        // (compare-and-swap) match: the query only matches if dispensedQuantity
        // is STILL exactly what we read a moment ago via `med` above. If a
        // concurrent dispense already changed it, this match fails and
        // findOneAndUpdate returns null — that's the signal to compensate.
        // (An earlier version tried to express the "don't exceed
        // quantityPrescribed" bound via arrayFilters + $expr; Mongoose's
        // update-casting layer rejected the '$med.quantityPrescribed' field
        // path with "Parameter obj to Document() must be an object" — caught
        // by the HTTP verification script, not by inspection. The bound is
        // already enforced earlier via the `remaining` check against this
        // same `med` snapshot, so CAS on dispensedQuantity alone is sufficient
        // and avoids that Mongoose/$expr interaction entirely.)
        const previousDispensed = med.dispensedQuantity;
        const patientAfterUpdate = await Patient.findOneAndUpdate(
            {
                id: patientId,
                'treatmentPlan.medications': { $elemMatch: { _id: med._id, dispensedQuantity: previousDispensed } }
            },
            { $inc: { 'treatmentPlan.medications.$.dispensedQuantity': quantity } },
            { new: true }
        );

        if (!patientAfterUpdate) {
            await Drug.findOneAndUpdate({ id: drugId }, { $inc: { stock: quantity } });
            await addLog(req, 'MEDICATION_DISPENSE_REJECTED', `Rejected (race): medication line ${medicationId} for patient ${patientId} was concurrently modified; stock restored`);
            return res.status(409).json({ error: 'This medication was concurrently dispensed by another request. Please refresh and try again.' });
        }

        const updatedMed = patientAfterUpdate.treatmentPlan.medications.id(medicationId);
        const newStatus = updatedMed.dispensedQuantity >= updatedMed.quantityPrescribed ? 'FULFILLED' : 'PARTIALLY_DISPENSED';
        // Captured via {new:true} and used as the response/broadcast body below —
        // patientAfterUpdate (from the CAS increment above) is a stale snapshot
        // that predates this status write.
        const finalPatient = await Patient.findOneAndUpdate(
            { id: patientId, 'treatmentPlan.medications._id': medicationId },
            { $set: { 'treatmentPlan.medications.$.status': newStatus } },
            { new: true }
        );

        await addLog(req, 'MEDICATION_DISPENSED', `Dispensed ${quantity} ${drug.unit}(s) of ${drug.name} (${drug.id}) to patient ${patient.name} (${patientId})`);
        req.io.emit('DRUG_UPDATED', updatedDrug);
        req.io.emit('PATIENT_UPDATED', finalPatient);
        await checkAndAlertLowStock(req, updatedDrug);

        res.json({ drug: updatedDrug, patient: finalPatient });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.runExpiryCheck = runExpiryCheck;
module.exports = router;
