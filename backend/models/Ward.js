const mongoose = require('mongoose');

const WardSchema = new mongoose.Schema({
    id: String,
    name: String,
    capacity: Number,
    occupied: Number,
    type: String
});

module.exports = mongoose.model('Ward', WardSchema);
