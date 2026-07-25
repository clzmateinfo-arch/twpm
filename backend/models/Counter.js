const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', CounterSchema);

// Atomic: findOneAndUpdate's $inc+upsert executes as a single MongoDB
// document operation, so concurrent callers can never observe/reuse the
// same seq value (unlike countDocuments()+1 used elsewhere in this app).
const getNextSequence = async (name) => {
    const counter = await Counter.findOneAndUpdate(
        { _id: name },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
};

module.exports = { Counter, getNextSequence };
