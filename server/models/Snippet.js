const mongoose = require("mongoose");

const snippetSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    default: "Untitled Snippet",
  },
  language: {
    type: String,
    default: "javascript",
  },
  code: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Snippet", snippetSchema);