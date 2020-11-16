const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
    session_id: { type: String, required: true },
    suggestion_context: String,
    suggestion: String
});

module.exports = mongoose.model('crowd-suggest', suggestionSchema);