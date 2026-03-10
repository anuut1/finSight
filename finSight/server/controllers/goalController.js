const Goal = require('../models/Goal');

exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ deadline: 1 });
    return res.json({ success: true, data: goals });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const { title, targetAmount, savedAmount = 0, deadline } = req.body;

    if (!title || !targetAmount || !deadline) {
      return res
        .status(400)
        .json({ success: false, message: 'Title, targetAmount and deadline are required' });
    }

    const goal = await Goal.create({
      userId: req.user.id,
      title,
      targetAmount,
      savedAmount,
      deadline,
    });

    return res.status(201).json({ success: true, data: goal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (req.body.savedAmount !== undefined) updates.savedAmount = req.body.savedAmount;
    if (req.body.status) updates.status = req.body.status;

    const goal = await Goal.findOneAndUpdate({ _id: id, userId: req.user.id }, updates, {
      new: true,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    return res.json({ success: true, data: goal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    return res.json({ success: true, data: goal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

