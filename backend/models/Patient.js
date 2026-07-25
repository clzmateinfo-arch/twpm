const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const PatientSchema = new mongoose.Schema({
    id: String,
    nic: String,
    name: String,
    dob: String,
    gender: String,
    contact: String,
    address: String,
    registrationDate: Date,
    vitals: {
        temperature: Number,
        pulse: Number,
        bpSystolic: Number,
        bpDiastolic: Number,
        respiratoryRate: Number,
        spo2: Number
    },
    symptoms: [String],
    triageLevel: String,
    consultationNotes: String,
    wardId: String,
    bedNumber: String,
    status: { type: String, default: 'TRIAGE' },
    vitalsHistory: [{
        temperature: Number,
        pulse: Number,
        bpSystolic: Number,
        bpDiastolic: Number,
        respiratoryRate: Number,
        spo2: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    treatmentPlan: {
        medications: [{
            drugId: { type: String, default: null },
            name: { type: String, required: true },
            dosage: String,
            frequency: String,
            quantityPrescribed: { type: Number, default: null },
            dispensedQuantity: { type: Number, default: 0 },
            status: { type: String, enum: ['PENDING', 'PARTIALLY_DISPENSED', 'FULFILLED', 'NOT_LINKED'], default: 'NOT_LINKED' }
        }],
        procedures: [String],
        instructions: String
    },
    dischargeSummary: {
        diagnosis: String,
        followUpDate: Date,
        prescriptions: [String],
        advice: String,
        dischargedAt: Date
    }
});

const encKey = process.env.PII_ENCRYPTION_KEY;
const sigKey = process.env.PII_SIGNING_KEY;
PatientSchema.plugin(encrypt, {
    encryptionKey: encKey,
    signingKey: sigKey,
    encryptedFields: ['name', 'nic', 'contact', 'address'],
    requireAuthenticationCode: false
});

module.exports = mongoose.model('Patient', PatientSchema);
