const mongoose = require("mongoose");

const committeeSchema = new mongoose.Schema({
  email: String,
  password: String,
});

module.exports = mongoose.model("Committee", committeeSchema, "committees"); // 👈 explicitly use 'committees'
