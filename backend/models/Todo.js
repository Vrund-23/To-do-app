// models/Todo.js
const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: [true, 'Please add some text'],
    trim: true,
    maxlength: [500, 'Text can not be more than 500 characters'],
  },
  completed: {
    type: Boolean,
    default: false,
  },
  deadline: {
    type: Date,
    default: null,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot be more than 50 characters'],
  },
}, { timestamps: true });

module.exports = mongoose.model('Todo', TodoSchema);