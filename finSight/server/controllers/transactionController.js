const Transaction = require('../models/Transaction');
const SplitGroup = require('../models/SplitGroup');
const { parseNaturalLanguageInput } = require('../services/quickAddParser');

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
    const {
      type,
      category,
      amount,
      description,
      date,
      tags = [],
      mood = 'neutral',
      autoTagTrip = true,
      splitGroupId,
    } = req.body;

    if (!type || !category || !amount || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let finalTags = Array.isArray(tags) ? [...tags] : [];
    let finalSplitGroupId = splitGroupId;
    let source = 'manual';
    let currency = 'INR';
    let activeTrip = null;

    if (autoTagTrip !== false && !finalSplitGroupId) {
      activeTrip = await SplitGroup.findOne({
        userId: req.user.id,
        isTrip: true,
        tripStatus: 'active',
      });

      if (activeTrip) {
        finalSplitGroupId = activeTrip._id;
        source = 'trip';
        currency = activeTrip.currency || 'INR';
        if (!finalTags.includes('trip')) finalTags.push('trip');
        if (!finalTags.includes(activeTrip.name)) finalTags.push(activeTrip.name);
      }
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      category,
      amount,
      description,
      date,
      tags: finalTags,
      mood,
      source,
      currency,
      splitGroupId: finalSplitGroupId,
    });

    // If an active trip exists and this is an expense, automatically sync as a trip expense split among preset members
    if (activeTrip && type === 'expense' && activeTrip.members?.length) {
      try {
        const memberIds = activeTrip.members.map((m) => m._id);
        const ownerId = activeTrip.ownerMemberId || memberIds[0];
        const numericAmount = Number(amount);
        const personalShare =
          Math.round(((numericAmount / memberIds.length) + Number.EPSILON) * 100) / 100;

        const tripExpense = activeTrip.expenses.create({
          description: description || `${category} expense`,
          amount: numericAmount,
          paidBy: ownerId,
          splitBetween: memberIds,
          date,
          category,
          syncPersonal: false, // Already created personal transaction above
          personalShareAmount: personalShare,
          personalTransactionId: transaction._id,
        });

        activeTrip.expenses.push(tripExpense);
        await activeTrip.save();

        transaction.splitExpenseId = tripExpense._id;
        await transaction.save();
      } catch (tripSyncErr) {
        console.warn('Could not auto-add expense to active trip:', tripSyncErr.message);
      }
    }

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

exports.parseQuickAdd = async (req, res) => {
  try {
    const { text, timeZone, currentDate } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Input text is required' });
    }

    const parsed = await parseNaturalLanguageInput(text, {
      timeZone,
      currentDate,
      user: req.user,
    });

    return res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Quick add parsing error:', err);
    return res.status(500).json({ success: false, message: 'Failed to parse natural language input' });
  }
};

