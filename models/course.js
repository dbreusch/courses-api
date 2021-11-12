// db-api: database schema for courses
const mongoose = require('mongoose');
// const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const courseSchema = new Schema({
  purchaseSequence: { type: Number, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  tools: { type: String, required: true },
  hours: { type: Number, required: true },
  sections: { type: Number, required: true },
  lectures: { type: Number, required: true },
  instructor: { type: String, required: true },
  dateBought: { type: Date, required: true },
  dateStarted: { type: Date, required: false },
  started: { type: Boolean, required: false },
  dateCompleted: { type: Date, required: true },
  completed: { type: Boolean, required: false },
  description: { type: String, required: false },
  notes: { type: String, required: false }
});

module.exports = mongoose.model('Course', courseSchema);
