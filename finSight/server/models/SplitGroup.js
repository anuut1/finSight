const mongoose = require('mongoose');

const splitMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: true }
);

const splitExpenseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paidBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    splitBetween: [{ type: mongoose.Schema.Types.ObjectId, required: true }],
    date: { type: Date, required: true },
    category: { type: String, trim: true, default: 'Shared' },
    syncPersonal: { type: Boolean, default: true },
    personalShareAmount: { type: Number, min: 0, default: 0 },
    personalTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  },
  { timestamps: true }
);

const splitSettlementSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, required: true },
    to: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

const splitGroupSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    ownerMemberId: { type: mongoose.Schema.Types.ObjectId },
    members: [splitMemberSchema],
    expenses: [splitExpenseSchema],
    settlements: [splitSettlementSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SplitGroup', splitGroupSchema);
