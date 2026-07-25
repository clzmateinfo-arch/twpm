const mongoose = require('mongoose');

const DRUG_FORMS = ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'DROPS', 'INHALER', 'OTHER'];
const DRUG_UNITS = ['tablet', 'capsule', 'ml', 'mg', 'g', 'vial', 'dose'];
const FRACTIONAL_UNITS = ['ml', 'mg', 'g'];

const DrugSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    form: { type: String, required: true, enum: DRUG_FORMS },
    strength: { type: String, required: true, trim: true },
    unit: { type: String, required: true, enum: DRUG_UNITS },
    stock: { type: Number, required: true, default: 0, min: 0 },
    reorderThreshold: { type: Number, required: true, default: 10, min: 0 },
    expiryDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
    dedupeKey: { type: String, required: true },
    lastExpiryAlertDate: { type: Date, default: null }
}, { timestamps: true });

DrugSchema.pre('validate', function (next) {
    if (this.name && this.form && this.strength) {
        this.dedupeKey = `${this.name.trim().toLowerCase()}|${this.form}|${this.strength.trim().toLowerCase()}`;
    }
    next();
});

// Scoped to active:true so a soft-deleted drug's identity (name+form+strength)
// can be reused by a newly created active entry without collision.
DrugSchema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { active: true } });

DrugSchema.statics.FORMS = DRUG_FORMS;
DrugSchema.statics.UNITS = DRUG_UNITS;
DrugSchema.statics.isFractionalUnit = (unit) => FRACTIONAL_UNITS.includes(unit);

module.exports = mongoose.model('Drug', DrugSchema);
