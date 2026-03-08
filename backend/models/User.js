const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['NURSE', 'DOCTOR', 'ADMIN'], required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isFirstLogin: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    language: { type: String, enum: ['en', 'si'], default: 'en' }
});

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
