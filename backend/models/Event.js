const mongoose = require('mongoose');
module.exports = mongoose.model('Event', new mongoose.Schema({
  name: String,
  startDate: String,
  endDate: String,
  startTime: String,
  endTime: String,
  location: String,
  requirements: String
}));