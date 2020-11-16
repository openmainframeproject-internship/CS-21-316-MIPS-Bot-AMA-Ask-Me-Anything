const mongoose = require('mongoose');

const fbSchema = new mongoose.Schema({
    session_id: { type: String, required: true },
    feedback_type: String,
    feedback: String
});

module.exports = mongoose.model('Feedback', fbSchema);