const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  session_id: { type: String, required: true },
  input: { type: String, required: true },
  intent: String,
  entity: String,
  value: String,
  output: String
});

module.exports = mongoose.model('BotLogs', LogSchema);