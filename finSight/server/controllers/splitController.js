const SplitGroup = require('../models/SplitGroup');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const getMemberName = (group, memberId) => {
  const member = group.members.id(memberId);
  return member ? member.name : 'Unknown';
};

const getOwnerMemberId = (group) => {
  if (group.ownerMemberId && group.members.id(group.ownerMemberId)) {
    return group.ownerMemberId.toString();
  }

  return group.members[0]?._id.toString();
};

const calculateBalances = (group) => {
  const balances = {};

  group.members.forEach((member) => {
    balances[member._id.toString()] = 0;
  });

  group.expenses.forEach((expense) => {
    const paidBy = expense.paidBy.toString();
    const participants = expense.splitBetween.map((id) => id.toString());
    if (!participants.length || balances[paidBy] === undefined) return;

    balances[paidBy] += expense.amount;
    const share = expense.amount / participants.length;
    participants.forEach((memberId) => {
      if (balances[memberId] !== undefined) {
        balances[memberId] -= share;
      }
    });
  });

  group.settlements.forEach((settlement) => {
    const from = settlement.from.toString();
    const to = settlement.to.toString();

    if (balances[from] !== undefined) balances[from] += settlement.amount;
    if (balances[to] !== undefined) balances[to] -= settlement.amount;
  });

  const memberBalances = group.members.map((member) => {
    const memberId = member._id.toString();
    return {
      memberId,
      name: member.name,
      email: member.email,
      balance: roundMoney(balances[memberId] || 0),
    };
  });

  const creditors = memberBalances
    .filter((member) => member.balance > 0)
    .map((member) => ({ ...member }))
    .sort((a, b) => b.balance - a.balance);
  const debtors = memberBalances
    .filter((member) => member.balance < 0)
    .map((member) => ({ ...member, balance: Math.abs(member.balance) }))
    .sort((a, b) => b.balance - a.balance);

  const simplifiedDebts = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = roundMoney(Math.min(debtors[i].balance, creditors[j].balance));
    if (amount > 0) {
      simplifiedDebts.push({
        from: debtors[i].memberId,
        fromName: debtors[i].name,
        to: creditors[j].memberId,
        toName: creditors[j].name,
        amount,
      });
    }

    debtors[i].balance = roundMoney(debtors[i].balance - amount);
    creditors[j].balance = roundMoney(creditors[j].balance - amount);

    if (debtors[i].balance <= 0.01) i += 1;
    if (creditors[j].balance <= 0.01) j += 1;
  }

  return { memberBalances, simplifiedDebts };
};

const serializeGroup = (group) => {
  const { memberBalances, simplifiedDebts } = calculateBalances(group);
  const groupObject = group.toObject();
  const ownerMemberId = getOwnerMemberId(group);

  return {
    ...groupObject,
    ownerMemberId,
    expenses: groupObject.expenses.map((expense) => ({
      ...expense,
      paidByName: getMemberName(group, expense.paidBy),
      splitBetweenNames: expense.splitBetween.map((id) => getMemberName(group, id)),
    })),
    settlements: groupObject.settlements.map((settlement) => ({
      ...settlement,
      fromName: getMemberName(group, settlement.from),
      toName: getMemberName(group, settlement.to),
    })),
    memberBalances,
    simplifiedDebts,
  };
};

exports.getGroups = async (req, res) => {
  try {
    const groups = await SplitGroup.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    return res.json({ success: true, data: groups.map(serializeGroup) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, members = [] } = req.body;
    const user = await User.findById(req.user.id);

    if (!name) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    const cleanMembers = members
      .map((member) => ({
        name: String(member.name || '').trim(),
        email: String(member.email || '').trim(),
      }))
      .filter((member) => member.name);

    const userEmail = user?.email?.toLowerCase();
    const matchingUserIndex = cleanMembers.findIndex(
      (member) =>
        (userEmail && member.email.toLowerCase() === userEmail) ||
        member.name.toLowerCase() === 'you'
    );

    if (matchingUserIndex >= 0) {
      cleanMembers[matchingUserIndex] = {
        name: user?.name || cleanMembers[matchingUserIndex].name,
        email: user?.email || cleanMembers[matchingUserIndex].email,
      };
    } else if (user) {
      cleanMembers.unshift({ name: user.name, email: user.email });
    }

    if (cleanMembers.length < 2) {
      return res.status(400).json({ success: false, message: 'Add at least two members' });
    }

    const group = new SplitGroup({
      userId: req.user.id,
      name,
      members: cleanMembers,
      expenses: [],
      settlements: [],
    });

    const ownerMember =
      group.members.find((member) => userEmail && member.email === userEmail) || group.members[0];
    group.ownerMemberId = ownerMember._id;

    await group.save();

    return res.status(201).json({ success: true, data: serializeGroup(group) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const {
      description,
      amount,
      paidBy,
      splitBetween = [],
      date,
      category = 'Shared',
      syncPersonal = true,
    } = req.body;

    if (!description || !amount || !paidBy || !date || !splitBetween.length) {
      return res.status(400).json({ success: false, message: 'Missing expense details' });
    }

    const group = await SplitGroup.findOne({ _id: groupId, userId: req.user.id });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const memberIds = group.members.map((member) => member._id.toString());
    const invalidMember =
      !memberIds.includes(paidBy) || splitBetween.some((memberId) => !memberIds.includes(memberId));

    if (invalidMember) {
      return res.status(400).json({ success: false, message: 'Invalid group member selected' });
    }

    const ownerMemberId = getOwnerMemberId(group);
    const numericAmount = Number(amount);
    const personalShareAmount = splitBetween.includes(ownerMemberId)
      ? roundMoney(numericAmount / splitBetween.length)
      : 0;

    const expense = group.expenses.create({
      description,
      amount: numericAmount,
      paidBy,
      splitBetween,
      date,
      category,
      syncPersonal,
      personalShareAmount: syncPersonal ? personalShareAmount : 0,
    });

    group.expenses.push(expense);
    await group.save();

    if (syncPersonal && personalShareAmount > 0) {
      const transaction = await Transaction.create({
        userId: req.user.id,
        type: 'expense',
        category,
        amount: personalShareAmount,
        description: `${description} (${group.name} split share)`,
        date,
        tags: ['split', group.name],
        mood: 'neutral',
        source: 'split',
        splitGroupId: group._id,
        splitExpenseId: expense._id,
      });

      expense.personalTransactionId = transaction._id;
      await group.save();
    }

    return res.status(201).json({ success: true, data: serializeGroup(group) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addSettlement = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { from, to, amount, date, note } = req.body;

    if (!from || !to || !amount || !date) {
      return res.status(400).json({ success: false, message: 'Missing settlement details' });
    }

    const group = await SplitGroup.findOne({ _id: groupId, userId: req.user.id });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const memberIds = group.members.map((member) => member._id.toString());
    if (!memberIds.includes(from) || !memberIds.includes(to) || from === to) {
      return res.status(400).json({ success: false, message: 'Invalid settlement members' });
    }

    group.settlements.push({
      from,
      to,
      amount: Number(amount),
      date,
      note,
    });

    await group.save();
    return res.status(201).json({ success: true, data: serializeGroup(group) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await SplitGroup.findOneAndDelete({
      _id: req.params.groupId,
      userId: req.user.id,
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const transactionIds = group.expenses
      .map((expense) => expense.personalTransactionId)
      .filter(Boolean);

    if (transactionIds.length) {
      await Transaction.deleteMany({ _id: { $in: transactionIds }, userId: req.user.id });
    }

    return res.json({ success: true, data: group });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
