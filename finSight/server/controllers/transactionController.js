const Transaction = require('../models/Transaction');

exports.getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = { userId: req.user.id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Transaction.find(query).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { type, category, amount, description, date, tags = [], mood = 'neutral' } = req.body;

    if (!type || !category || !amount || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      category,
      amount,
      description,
      date,
      tags,
      mood,
    });

    return res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      req.body,
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    return res.json({ success: true, data: transaction });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    return res.json({ success: true, data: transaction });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

