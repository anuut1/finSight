const mongoose = require('mongoose');

const upiDraftSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'SplitGroup', index: true },
    rawText: { type: String, trim: true },
    cleanMerchant: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'Other' },
    date: { type: Date, default: Date.now },
    upiRef: { type: String, trim: true, index: true },
    payerVpa: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending_assignment', 'assigned_to_expense', 'poll_created', 'dismissed'],
      default: 'pending_assignment',
      index: true,
    },
    assignedExpenseId: { type: mongoose.Schema.Types.ObjectId },
    poll: {
      question: { type: String },
      options: [{ memberId: { type: mongoose.Schema.Types.ObjectId }, name: { type: String }, votes: { type: Number, default: 0 } }],
      closed: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UpiDraft', upiDraftSchema);
