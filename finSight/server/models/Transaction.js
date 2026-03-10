const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    tags: [{ type: String }],
    mood: { type: String, enum: ['happy', 'neutral', 'stressed'], default: 'neutral' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);

