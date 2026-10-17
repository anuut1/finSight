const crypto = require('crypto');
const SplitGroup = require('../models/SplitGroup');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const UpiDraft = require('../models/UpiDraft');
const { cleanAndCategorizeExpense } = require('../services/bedrockService');
const {
  findGroupWithAccess,
  canManageMembers,
  canDeleteGroup,
  canEndTrip,
  canAddExpense,
  canAddSettlement,
} = require('../services/splitAccess');
const { sendGroupInviteEmailViaSes } = require('../services/emailService');

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
      userId: member.userId,
      role: member.role || 'member',
      status: member.status || 'active',
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

const serializeGroup = (group, currentUserId = null) => {
  const { memberBalances, simplifiedDebts } = calculateBalances(group);
  const groupObject = group.toObject();
  const ownerMemberId = getOwnerMemberId(group);

  const uIdStr = currentUserId ? currentUserId.toString() : null;
  const isCreator = group.userId && uIdStr && group.userId.toString() === uIdStr;
  const activeMember = uIdStr && group.members
    ? group.members.find((m) => m.userId && m.userId.toString() === uIdStr && m.status === 'active')
    : null;
  const userRole = isCreator || (activeMember && activeMember.role === 'owner')
    ? 'owner'
    : (activeMember ? 'member' : 'stranger');
  const canManage = userRole === 'owner';

  return {
    ...groupObject,
    ownerMemberId,
    userRole,
    canManage,
    expenses: groupObject.expenses.map((expense) => {
      // Isolate personalSync so that a member only sees their own personal transaction info
      const myPersonalSync = uIdStr && Array.isArray(expense.personalSync)
        ? expense.personalSync.find((ps) => ps.userId && ps.userId.toString() === uIdStr)
        : null;

      return {
        ...expense,
        paidByName: getMemberName(group, expense.paidBy),
        splitBetweenNames: expense.splitBetween.map((id) => getMemberName(group, id)),
        // Only expose personalTransactionId if it belongs to current user
        personalTransactionId: myPersonalSync?.transactionId || (isCreator ? expense.personalTransactionId : null),
        personalShareAmount: myPersonalSync?.amount || (isCreator ? expense.personalShareAmount : 0),
        personalSync: myPersonalSync ? [myPersonalSync] : [],
      };
    }),
    settlements: groupObject.settlements.map((settlement) => ({
      ...settlement,
      fromName: getMemberName(group, settlement.from),
      toName: getMemberName(group, settlement.to),
    })),
    memberBalances,
    simplifiedDebts,
  };
};

/**
 * Get groups where current user is the creator OR an active member.
 */
exports.getGroups = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const groups = await SplitGroup.find({
      $or: [
        { userId: currentUserId },
        { 'members.userId': currentUserId, 'members.status': 'active' },
      ],
    }).sort({ updatedAt: -1 });

    return res.json({
      success: true,
      data: groups.map((g) => serializeGroup(g, currentUserId)),
    });
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
        userId: member.userId || undefined,
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
        userId: req.user.id,
        role: 'owner',
        status: 'active',
      };
    } else if (user) {
      cleanMembers.unshift({
        name: user.name,
        email: user.email,
        userId: req.user.id,
        role: 'owner',
        status: 'active',
      });
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

    return res.status(201).json({ success: true, data: serializeGroup(group, req.user.id) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Add a shared expense with isolated per-member personal budget sync.
 */
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

    const { group, access } = await findGroupWithAccess(groupId, req.user.id);
    if (!group) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    if (!canAddExpense(access)) {
      return res.status(403).json({ success: false, message: 'Permission denied to add expense' });
    }

    const memberIds = group.members.map((member) => member._id.toString());
    const invalidMember =
      !memberIds.includes(paidBy) || splitBetween.some((memberId) => !memberIds.includes(memberId));

    if (invalidMember) {
      return res.status(400).json({ success: false, message: 'Invalid group member selected' });
    }

    const numericAmount = Number(amount);
    const perMemberShare = roundMoney(numericAmount / splitBetween.length);

    const expense = group.expenses.create({
      description,
      amount: numericAmount,
      paidBy,
      splitBetween,
      date,
      category,
      syncPersonal,
      personalShareAmount: perMemberShare,
      createdBy: req.user.id,
      personalSync: [],
    });

    // Create personal transaction for EACH participant linked to a user account
    if (syncPersonal && perMemberShare > 0) {
      for (const participantId of splitBetween) {
        const participantMember = group.members.id(participantId);
        if (participantMember && participantMember.userId) {
          try {
            const tx = await Transaction.create({
              userId: participantMember.userId,
              type: 'expense',
              category,
              amount: perMemberShare,
              description: `${description} (${group.name} split share)`,
              date,
              tags: ['split', group.name],
              mood: 'neutral',
              source: 'split',
              splitGroupId: group._id,
              splitExpenseId: expense._id,
            });

            expense.personalSync.push({
              userId: participantMember.userId,
              amount: perMemberShare,
              transactionId: tx._id,
            });

            if (participantMember.userId.toString() === req.user.id.toString()) {
              expense.personalTransactionId = tx._id;
              expense.personalShareAmount = perMemberShare;
            }
          } catch (txErr) {
            console.warn('[PersonalSync] Failed to create transaction for member:', participantMember.userId, txErr.message);
          }
        }
      }
    }

    group.expenses.push(expense);
    await group.save();

    return res.status(201).json({ success: true, data: serializeGroup(group, req.user.id) });
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

    const { group, access } = await findGroupWithAccess(groupId, req.user.id);
    if (!group) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const memberIds = group.members.map((member) => member._id.toString());
    if (!memberIds.includes(from) || !memberIds.includes(to) || from === to) {
      return res.status(400).json({ success: false, message: 'Invalid settlement members' });
    }

    if (!canAddSettlement(access, { from, to })) {
      return res.status(403).json({ success: false, message: 'You can only record settlements involving yourself' });
    }

    group.settlements.push({
      from,
      to,
      amount: Number(amount),
      date,
      note,
      createdBy: req.user.id,
    });

    await group.save();
    return res.status(201).json({ success: true, data: serializeGroup(group, req.user.id) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { group, access } = await findGroupWithAccess(req.params.groupId, req.user.id);
    if (!group) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    if (!canDeleteGroup(access)) {
      return res.status(403).json({ success: false, message: 'Only the group owner can delete this group' });
    }

    const transactionIds = [];
    group.expenses.forEach((expense) => {
      if (expense.personalTransactionId) transactionIds.push(expense.personalTransactionId);
      if (Array.isArray(expense.personalSync)) {
        expense.personalSync.forEach((ps) => {
          if (ps.transactionId) transactionIds.push(ps.transactionId);
        });
      }
    });

    if (transactionIds.length) {
      await Transaction.deleteMany({ _id: { $in: transactionIds } });
    }

    await group.deleteOne();

    return res.json({ success: true, data: group });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getTripSummaryData = (group, currentUserId = null) => {
  const serialized = serializeGroup(group, currentUserId);
  const totalSpend = roundMoney(
    group.expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
  );
  const totalMembers = group.members.length || 1;
  const perPersonFairShare = roundMoney(totalSpend / totalMembers);

  const memberContributions = group.members.map((m) => {
    const mId = m._id.toString();
    const paid = roundMoney(
      group.expenses
        .filter((e) => e.paidBy.toString() === mId)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    );
    const balanceInfo = serialized.memberBalances.find((mb) => mb.memberId === mId);
    return {
      memberId: mId,
      name: m.name,
      email: m.email,
      totalPaid: paid,
      netBalance: balanceInfo ? balanceInfo.balance : 0,
    };
  });

  return {
    ...serialized,
    tripSummary: {
      totalSpend,
      expensesCount: group.expenses.length,
      currency: group.currency || 'INR',
      perPersonFairShare,
      memberContributions,
      simplifiedDebts: serialized.simplifiedDebts,
      status: group.tripStatus || 'ended',
      startDate: group.startDate,
      endDate: group.endDate,
    },
  };
};

exports.getActiveTrip = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const activeTrip = await SplitGroup.findOne({
      $or: [
        { userId: currentUserId },
        { 'members.userId': currentUserId, 'members.status': 'active' },
      ],
      isTrip: true,
      tripStatus: 'active',
    });

    if (!activeTrip) {
      return res.json({ success: true, data: null });
    }

    return res.json({ success: true, data: getTripSummaryData(activeTrip, currentUserId) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.startTrip = async (req, res) => {
  try {
    const { name, members = [], currency = 'INR' } = req.body;
    const user = await User.findById(req.user.id);

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Trip name is required' });
    }

    const cleanMembers = members
      .map((member) => ({
        name: String(member.name || '').trim(),
        email: String(member.email || '').trim(),
        userId: member.userId || undefined,
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
        userId: req.user.id,
        role: 'owner',
        status: 'active',
      };
    } else if (user) {
      cleanMembers.unshift({
        name: user.name,
        email: user.email,
        userId: req.user.id,
        role: 'owner',
        status: 'active',
      });
    }

    if (cleanMembers.length < 2) {
      return res.status(400).json({ success: false, message: 'Add at least two members for the trip' });
    }

    // End any previously active trips to prevent state conflicts
    await SplitGroup.updateMany(
      { userId: req.user.id, isTrip: true, tripStatus: 'active' },
      { $set: { tripStatus: 'ended', endDate: new Date() } }
    );

    const tripGroup = new SplitGroup({
      userId: req.user.id,
      name: name.trim(),
      members: cleanMembers,
      expenses: [],
      settlements: [],
      isTrip: true,
      tripStatus: 'active',
      currency: (currency || 'INR').toUpperCase(),
      startDate: new Date(),
    });

    const ownerMember =
      tripGroup.members.find((member) => userEmail && member.email === userEmail) || tripGroup.members[0];
    tripGroup.ownerMemberId = ownerMember._id;

    await tripGroup.save();

    return res.status(201).json({ success: true, data: getTripSummaryData(tripGroup, req.user.id) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.endTrip = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { group, access } = await findGroupWithAccess(groupId, req.user.id);

    if (!group) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    if (!canEndTrip(access)) {
      return res.status(403).json({ success: false, message: 'Only the trip host can end this trip' });
    }

    group.tripStatus = 'ended';
    group.endDate = new Date();
    await group.save();

    return res.json({ success: true, data: getTripSummaryData(group, req.user.id) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTripSummary = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { group, access } = await findGroupWithAccess(groupId, req.user.id);

    if (!group) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    return res.json({ success: true, data: getTripSummaryData(group, req.user.id) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Invite a member to group by email or friend user ID (Owner only).
 * Tokens are random, hashed at rest, single-use, and expire in 7 days.
 */
exports.inviteMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email, friendUserId, name } = req.body;

    const { group, access } = await findGroupWithAccess(groupId, req.user.id);
    if (!group) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    if (!canManageMembers(access)) {
      return res.status(403).json({ success: false, message: 'Only the group owner can invite members' });
    }

    let targetEmail = '';
    let targetName = name || '';
    let targetUserId = null;

    if (friendUserId) {
      const friendUser = await User.findById(friendUserId);
      if (!friendUser) {
        return res.status(404).json({ success: false, message: 'Friend user not found' });
      }
      targetEmail = friendUser.email.toLowerCase();
      targetName = targetName || friendUser.name;
      targetUserId = friendUser._id;
    } else if (email) {
      targetEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({ email: targetEmail });
      if (existingUser) {
        targetUserId = existingUser._id;
        targetName = targetName || existingUser.name;
      } else {
        targetName = targetName || targetEmail.split('@')[0];
      }
    } else {
      return res.status(400).json({ success: false, message: 'Please provide an email or friend to invite' });
    }

    // Check if user is already an active member
    const isAlreadyActive = group.members.some(
      (m) =>
        (targetEmail && m.email && m.email.toLowerCase() === targetEmail && m.status === 'active') ||
        (targetUserId && m.userId && m.userId.toString() === targetUserId.toString() && m.status === 'active')
    );
    if (isAlreadyActive) {
      return res.status(400).json({ success: false, message: 'User is already an active member of this group' });
    }

    // Generate secure single-use token (7-day expiry, hashed at rest)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    group.invites.push({
      email: targetEmail,
      token: tokenHash,
      role: 'member',
      invitedBy: req.user.id,
      status: 'pending',
      createdAt: new Date(),
      expiresAt,
    });

    const inviteRecord = group.invites[group.invites.length - 1];

    // Ensure a pending member record exists
    let existingMember = group.members.find(
      (m) =>
        (targetEmail && m.email && m.email.toLowerCase() === targetEmail) ||
        (targetUserId && m.userId && m.userId.toString() === targetUserId.toString())
    );

    if (existingMember) {
      existingMember.status = 'pending';
      if (targetUserId) existingMember.userId = targetUserId;
    } else {
      group.members.push({
        name: targetName,
        email: targetEmail,
        userId: targetUserId || undefined,
        role: 'member',
        status: 'pending',
      });
    }

    await group.save();

    // Send SES invite email
    sendGroupInviteEmailViaSes({
      toEmail: targetEmail,
      inviterName: req.user.name,
      groupName: group.name,
      isTrip: group.isTrip,
      inviteToken: rawToken,
      isRegistered: Boolean(targetUserId),
    }).catch((err) => console.warn('[SES Group Invite] Error:', err.message));

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${clientUrl}/splits?invite=${encodeURIComponent(rawToken)}`;

    return res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        inviteId: inviteRecord._id,
        email: targetEmail,
        rawToken,
        inviteLink,
        expiresAt,
        group: serializeGroup(group, req.user.id),
      },
    });
  } catch (err) {
    console.error('Error inviting member:', err);
    return res.status(500).json({ success: false, message: 'Failed to invite member' });
  }
};

/**
 * List pending group invites for current logged-in user.
 */
exports.getMyPendingInvites = async (req, res) => {
  try {
    const userEmail = (req.user.email || '').toLowerCase();
    const groups = await SplitGroup.find({
      invites: {
        $elemMatch: {
          email: userEmail,
          status: 'pending',
          expiresAt: { $gt: new Date() },
        },
      },
    }).populate('invites.invitedBy', 'name email avatarUrl');

    const pendingInvites = [];
    groups.forEach((group) => {
      const matchingInvites = group.invites.filter(
        (inv) =>
          inv.email === userEmail &&
          inv.status === 'pending' &&
          new Date(inv.expiresAt) > new Date()
      );

      matchingInvites.forEach((inv) => {
        pendingInvites.push({
          inviteId: inv._id,
          groupId: group._id,
          groupName: group.name,
          isTrip: group.isTrip,
          role: inv.role,
          invitedBy: inv.invitedBy?.name || 'Group Owner',
          invitedByEmail: inv.invitedBy?.email,
          createdAt: inv.createdAt,
          expiresAt: inv.expiresAt,
        });
      });
    });

    return res.json({ success: true, data: pendingInvites });
  } catch (err) {
    console.error('Error getting pending invites:', err);
    return res.status(500).json({ success: false, message: 'Failed to load invites' });
  }
};

/**
 * Accept a group invite by inviteId or token.
 */
exports.acceptGroupInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { token } = req.body || {};
    const userEmail = (req.user.email || '').toLowerCase();

    let group = null;
    let invite = null;

    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
      group = await SplitGroup.findOne({
        'invites.token': tokenHash,
        'invites.status': 'pending',
        'invites.expiresAt': { $gt: new Date() },
      });
      if (group) {
        invite = group.invites.find(
          (inv) => inv.token === tokenHash && inv.status === 'pending'
        );
      }
    }

    if (!group && inviteId) {
      group = await SplitGroup.findOne({
        'invites._id': inviteId,
        'invites.status': 'pending',
        'invites.expiresAt': { $gt: new Date() },
      });
      if (group) {
        invite = group.invites.id(inviteId);
      }
    }

    if (!group || !invite) {
      return res.status(404).json({ success: false, message: 'Invite not found or has expired' });
    }

    // Mark single-use token as accepted
    invite.status = 'accepted';

    // Activate membership in group
    let member = group.members.find(
      (m) =>
        (m.email && m.email.toLowerCase() === userEmail) ||
        (invite.email && m.email && m.email.toLowerCase() === invite.email.toLowerCase()) ||
        (m.userId && m.userId.toString() === req.user.id.toString())
    );

    if (member) {
      member.userId = req.user.id;
      member.status = 'active';
      member.name = req.user.name || member.name;
    } else {
      group.members.push({
        name: req.user.name || invite.email.split('@')[0],
        email: userEmail,
        userId: req.user.id,
        role: 'member',
        status: 'active',
      });
    }

    await group.save();

    return res.json({
      success: true,
      message: `You joined "${group.name}"`,
      data: serializeGroup(group, req.user.id),
    });
  } catch (err) {
    console.error('Error accepting group invite:', err);
    return res.status(500).json({ success: false, message: 'Failed to accept invite' });
  }
};

/**
 * Decline a group invite.
 */
exports.declineGroupInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { token } = req.body || {};
    const userEmail = (req.user.email || '').toLowerCase();

    let group = null;
    let invite = null;

    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
      group = await SplitGroup.findOne({
        'invites.token': tokenHash,
        'invites.status': 'pending',
      });
      if (group) {
        invite = group.invites.find((inv) => inv.token === tokenHash);
      }
    }

    if (!group && inviteId) {
      group = await SplitGroup.findOne({
        'invites._id': inviteId,
      });
      if (group) {
        invite = group.invites.id(inviteId);
      }
    }

    if (!group || !invite) {
      return res.status(404).json({ success: false, message: 'Invite not found' });
    }

    invite.status = 'declined';

    // Remove pending member entry if it has no expenses or settlements
    const member = group.members.find(
      (m) =>
        (m.email && m.email.toLowerCase() === userEmail) ||
        (invite.email && m.email && m.email.toLowerCase() === invite.email.toLowerCase())
    );

    if (member && member.status === 'pending') {
      const hasHistory =
        group.expenses.some((e) => e.paidBy.toString() === member._id.toString() || e.splitBetween.map((id) => id.toString()).includes(member._id.toString())) ||
        group.settlements.some((s) => s.from.toString() === member._id.toString() || s.to.toString() === member._id.toString());

      if (!hasHistory) {
        group.members.pull(member._id);
      }
    }

    await group.save();

    return res.json({ success: true, message: 'Invite declined' });
  } catch (err) {
    console.error('Error declining group invite:', err);
    return res.status(500).json({ success: false, message: 'Failed to decline invite' });
  }
};

/**
 * Leave a group (Non-owner member only).
 */
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { group, access } = await findGroupWithAccess(groupId, req.user.id);

    if (!group) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    if (access.isOwner) {
      const otherActiveMembers = group.members.filter(
        (m) => m._id.toString() !== access.currentMember?._id.toString() && m.status === 'active'
      );
      if (otherActiveMembers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'The group owner cannot leave the group while other members are present. You can delete the group instead.',
        });
      }
    }

    if (!access.currentMember) {
      return res.status(404).json({ success: false, message: 'Member record not found' });
    }

    // Verify member has settled balances
    const { memberBalances } = calculateBalances(group);
    const myBalance = memberBalances.find(
      (mb) => mb.memberId === access.currentMember._id.toString()
    );

    if (myBalance && Math.abs(myBalance.balance) > 0.5) {
      return res.status(400).json({
        success: false,
        message: `Please settle your outstanding balance of ₹${Math.abs(myBalance.balance).toFixed(2)} before leaving the group.`,
      });
    }

    access.currentMember.status = 'inactive';
    await group.save();

    return res.json({ success: true, message: 'You have left the group' });
  } catch (err) {
    console.error('Error leaving group:', err);
    return res.status(500).json({ success: false, message: 'Failed to leave group' });
  }
};

/**
 * Remove a member from the group (Owner only).
 */
exports.removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { group, access } = await findGroupWithAccess(groupId, req.user.id);

    if (!group) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    if (!canManageMembers(access)) {
      return res.status(403).json({ success: false, message: 'Only the group owner can remove members' });
    }

    const targetMember = group.members.id(memberId);
    if (!targetMember) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (targetMember._id.toString() === group.ownerMemberId?.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove the group owner' });
    }

    // Check active balance
    const { memberBalances } = calculateBalances(group);
    const mb = memberBalances.find((b) => b.memberId === memberId);
    if (mb && Math.abs(mb.balance) > 0.5) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove member with active balance of ₹${Math.abs(mb.balance).toFixed(2)}. Please settle first.`,
      });
    }

    // If member has no past expense/settlement records, we can remove them cleanly
    const hasHistory =
      group.expenses.some((e) => e.paidBy.toString() === memberId || e.splitBetween.map((id) => id.toString()).includes(memberId)) ||
      group.settlements.some((s) => s.from.toString() === memberId || s.to.toString() === memberId);

    if (!hasHistory) {
      group.members.pull(memberId);
    } else {
      targetMember.status = 'inactive';
    }

    await group.save();

    return res.json({
      success: true,
      message: 'Member removed successfully',
      data: serializeGroup(group, req.user.id),
    });
  } catch (err) {
    console.error('Error removing member:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
};

exports.getUpiDrafts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { group, access } = await findGroupWithAccess(groupId, req.user.id);
    if (!group) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const drafts = await UpiDraft.find({
      tripId: groupId,
      status: { $in: ['pending_assignment', 'poll_created'] },
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: drafts });
  } catch (err) {
    console.error('Error fetching UPI drafts:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createUpiDraft = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { amount, rawText, upiRef } = req.body;

    const { group, access } = await findGroupWithAccess(groupId, req.user.id);
    if (!group) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const aiCleaned = await cleanAndCategorizeExpense(rawText || `UPI payment of ${amount}`);

    const draft = new UpiDraft({
      tripId: groupId,
      rawText: rawText || '',
      cleanMerchant: aiCleaned.cleanMerchant,
      amount: Number(amount) || 0,
      category: aiCleaned.category,
      upiRef: upiRef || '',
      status: 'pending_assignment',
    });

    await draft.save();
    return res.status(201).json({ success: true, data: draft });
  } catch (err) {
    console.error('Error creating UPI draft:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.assignUpiDraft = async (req, res) => {
  try {
    const { groupId, draftId } = req.params;
    const { mode = 'assign', splitBetween, paidBy, question } = req.body;

    const { group, access } = await findGroupWithAccess(groupId, req.user.id);
    if (!group) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const draft = await UpiDraft.findOne({ _id: draftId, tripId: groupId });
    if (!draft) {
      return res.status(404).json({ success: false, message: 'UPI draft not found' });
    }

    if (mode === 'poll') {
      draft.status = 'poll_created';
      draft.poll = {
        question: question || `Who shared the payment of ₹${draft.amount} to ${draft.cleanMerchant}?`,
        options: group.members.map((m) => ({
          memberId: m._id,
          name: m.name,
          votes: 0,
        })),
        closed: false,
      };
      await draft.save();
      return res.json({ success: true, message: 'Poll created for UPI draft', data: draft });
    }

    // Default 'assign' mode: Pick people
    const payerId = paidBy || group.ownerMemberId || group.members[0]?._id;
    const participants =
      Array.isArray(splitBetween) && splitBetween.length > 0
        ? splitBetween
        : group.members.map((m) => m._id);

    const newExpense = {
      description: draft.cleanMerchant,
      amount: draft.amount,
      paidBy: payerId,
      splitBetween: participants,
      date: draft.date || new Date(),
      category: draft.category || 'Shared',
      createdBy: req.user.id,
    };

    group.expenses.push(newExpense);
    await group.save();

    const createdExpense = group.expenses[group.expenses.length - 1];

    draft.status = 'assigned_to_expense';
    draft.assignedExpenseId = createdExpense._id;
    await draft.save();

    return res.json({
      success: true,
      message: 'Draft successfully converted to trip expense',
      data: {
        draft,
        expense: createdExpense,
        group: serializeGroup(group, req.user.id),
      },
    });
  } catch (err) {
    console.error('Error assigning UPI draft:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
