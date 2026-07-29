const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Ward = require('../models/Ward');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Drug = require('../models/Drug');
const { sendAlertEmail } = require('../mailer');
const jwt = require('jsonwebtoken');

const authMiddleware = require('../middleware/auth');


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

router.get('/data', async (req, res) => {
    try {
        const patients = await Patient.find();
        let wards = await Ward.find();
        const auditLogs = await AuditLog.find().sort({ timestamp: -1 });

        if (wards.length === 0) {
            await Ward.insertMany([]);
            wards = await Ward.find();
        }

        res.json({ patients, wards, auditLogs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/patients', async (req, res) => {
    try {
        const patientData = req.body;
        const count = await Patient.countDocuments();
        const newId = `P${(count + 1).toString().padStart(4, '0')}`;

        const patient = new Patient({
            ...patientData,
            id: newId,
            registrationDate: new Date(),
            status: 'TRIAGE'
        });
        await patient.save();

        await addLog(req, 'PATIENT_REGISTRATION', `Registered patient ${patient.name} (${patient.id})`);

        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const calculateTriageLevel = (vitals) => {
    const { spo2, respiratoryRate, pulse, bpSystolic } = vitals;
    if (spo2 < 90 || respiratoryRate > 30 || pulse > 120 || pulse < 50 || bpSystolic < 90) return 'CRITICAL';
    if ((spo2 >= 90 && spo2 <= 94) || (respiratoryRate >= 21 && respiratoryRate <= 29) || (pulse >= 100 && pulse <= 120) || (pulse >= 50 && pulse <= 60) || (bpSystolic > 90 && bpSystolic <= 100) || bpSystolic > 180) return 'URGENT';
    return 'NON_URGENT';
};

router.put('/patients/:id/vitals', async (req, res) => {
    try {
        const { vitals } = req.body;
        const triageLevel = req.body.triageLevel || calculateTriageLevel(vitals);
        const patient = await Patient.findOneAndUpdate(
            { id: req.params.id },
            {
                vitals,
                triageLevel,
                status: 'QUEUE',
                $push: { vitalsHistory: { ...vitals, timestamp: new Date() } }
            },
            { new: true }
        );
        await addLog(req, 'VITALS_CAPTURE', `Updated vitals for patient ${patient.name} (${req.params.id}) - ${triageLevel}`);

        req.io.emit('PATIENT_UPDATED', patient);
        if (triageLevel === 'CRITICAL') {
            req.io.emit('CRITICAL_ALERT', patient);
            sendAlertEmail(`CRITICAL Alert: Patient ${patient.name}`, `Patient ${patient.id} has recorded critical vitals. Immediate attention required.`);
        }

        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/patients/:id/notes', async (req, res) => {
    try {
        const { notes } = req.body;
        const patient = await Patient.findOneAndUpdate(
            { id: req.params.id },
            { consultationNotes: notes },
            { new: true }
        );
        await addLog(req, 'CONSULTATION_NOTES', `Added consultation notes for patient ${patient.name} (${req.params.id})`);
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/patients/:id/admit', async (req, res) => {
    try {
        const { wardId, bedNumber } = req.body;
        const patient = await Patient.findOneAndUpdate(
            { id: req.params.id },
            { wardId, bedNumber, status: 'ADMITTED' },
            { new: true }
        );
        const ward = await Ward.findOneAndUpdate(
            { id: wardId },
            { $inc: { occupied: 1 } },
            { new: true }
        );
        await addLog(req, 'WARD_ADMISSION', `Admitted patient ${patient.name} (${req.params.id}) to ward ${wardId}, bed ${bedNumber}`);

        req.io.emit('PATIENT_UPDATED', patient);
        req.io.emit('WARD_UPDATED', ward);

        const occupancyRate = (ward.occupied / ward.capacity) * 100;
        if (occupancyRate >= 90) {
            req.io.emit('WARD_CAPACITY_WARNING', ward);
            sendAlertEmail(`Ward Capacity Alert: ${ward.name}`, `Ward ${ward.name} is at ${Math.round(occupancyRate)}% capacity (${ward.occupied}/${ward.capacity}).`);
        }

        res.json({ patient, ward });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/patients/:id/discharge', async (req, res) => {
    try {
        const { summary } = req.body;
        const patient = await Patient.findOne({ id: req.params.id });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        if (patient.wardId) {
            const w = await Ward.findOneAndUpdate(
                { id: patient.wardId },
                { $inc: { occupied: -1 } },
                { new: true }
            );
            if (w) req.io.emit('WARD_UPDATED', w);
        }

        const updatedPatient = await Patient.findOneAndUpdate(
            { id: req.params.id },
            {
                status: 'DISCHARGED',
                wardId: null,
                bedNumber: null,
                dischargeSummary: { ...summary, dischargedAt: new Date() }
            },
            { new: true }
        );

        await addLog(req, 'PATIENT_DISCHARGE', `Discharged patient ${updatedPatient.name} (${req.params.id})`);
        req.io.emit('PATIENT_UPDATED', updatedPatient);
        res.json(updatedPatient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/patients/:id/treatment', async (req, res) => {
    try {
        const { treatmentPlan } = req.body;
        const existingPatient = await Patient.findOne({ id: req.params.id });
        if (!existingPatient) return res.status(404).json({ error: 'Patient not found' });

        const existingMedsById = new Map();
        for (const m of existingPatient.treatmentPlan?.medications || []) {
            existingMedsById.set(m._id.toString(), m);
        }

        const incomingMeds = treatmentPlan?.medications || [];
        const normalizedMeds = [];

        for (const incoming of incomingMeds) {
            // This endpoint overwrites the whole treatmentPlan on every save, including
            // from a doctor's UI that may hold a stale local copy. Dispensing progress
            // (drugId/quantityPrescribed/dispensedQuantity/status) is only ever mutated
            // by POST /api/pharmacy/dispense — the client is never the source of truth
            // for it, so an existing line's values are always taken from the DB, never
            // from whatever the client echoes back.
            const existing = incoming._id ? existingMedsById.get(String(incoming._id)) : null;

            if (existing) {
                normalizedMeds.push({
                    _id: existing._id,
                    name: incoming.name ?? existing.name,
                    dosage: incoming.dosage ?? existing.dosage,
                    frequency: incoming.frequency ?? existing.frequency,
                    drugId: existing.drugId,
                    quantityPrescribed: existing.quantityPrescribed,
                    dispensedQuantity: existing.dispensedQuantity,
                    status: existing.status
                });
                continue;
            }

            // New medication line.
            if (!incoming.name) {
                return res.status(400).json({ error: 'Each medication requires a name' });
            }

            if (incoming.drugId) {
                const drug = await Drug.findOne({ id: incoming.drugId });
                if (!drug || !drug.active) {
                    return res.status(400).json({ error: `Selected drug (${incoming.drugId}) not found or inactive` });
                }
                const qty = Number(incoming.quantityPrescribed);
                if (!Number.isFinite(qty) || qty <= 0) {
                    return res.status(400).json({ error: 'quantityPrescribed must be a positive number when a catalog drug is selected' });
                }
                normalizedMeds.push({
                    name: incoming.name,
                    dosage: incoming.dosage,
                    frequency: incoming.frequency,
                    drugId: incoming.drugId,
                    quantityPrescribed: qty,
                    dispensedQuantity: 0,
                    status: 'PENDING'
                });
            } else {
                // Custom / not-in-catalog: server forces non-dispensable
                // defaults regardless of anything else the client sent.
                normalizedMeds.push({
                    name: incoming.name,
                    dosage: incoming.dosage,
                    frequency: incoming.frequency,
                    drugId: null,
                    quantityPrescribed: null,
                    dispensedQuantity: 0,
                    status: 'NOT_LINKED'
                });
            }
        }

        const patient = await Patient.findOneAndUpdate(
            { id: req.params.id },
            { treatmentPlan: { ...treatmentPlan, medications: normalizedMeds } },
            { new: true }
        );
        await addLog(req, 'TREATMENT_UPDATED', `Updated treatment plan for patient ${patient.name} (${req.params.id})`);
        req.io.emit('PATIENT_UPDATED', patient);
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/analytics', async (req, res) => {
    try {
        const counts = {
            total: await Patient.countDocuments(),
            inQueue: await Patient.countDocuments({ status: 'QUEUE' }),
            admitted: await Patient.countDocuments({ status: 'ADMITTED' }),
            discharged: await Patient.countDocuments({ status: 'DISCHARGED' }),
            critical: await Patient.countDocuments({ triageLevel: 'CRITICAL', status: { $in: ['QUEUE', 'TRIAGE'] } })
        };
        res.json(counts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
