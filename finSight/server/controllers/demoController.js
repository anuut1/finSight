const Transaction = require('../models/Transaction');
const SplitGroup = require('../models/SplitGroup');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const RecurringTemplate = require('../models/RecurringTemplate');
const mongoose = require('mongoose');

/**
 * Seed Showcase / Demo Data for Faculty & Judge Presentations
 */
exports.seedDemoData = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Optional: clear existing demo-tagged data first to avoid duplicate pileup
    await Promise.all([
      Transaction.deleteMany({ userId, tags: 'demo-showcase' }),
      Budget.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      RecurringTemplate.deleteMany({ userId }),
      SplitGroup.deleteMany({ userId, name: { $in: ['Goa Vacation 2026', 'Flat 402 Roommates'] } }),
    ]);

    // 1. Transactions across 3 months
    const d = (daysAgo) => {
      const target = new Date();
      target.setDate(target.getDate() - daysAgo);
      return target;
    };

    const demoTransactions = [
      // Current Month Income & Expenses
      {
        userId,
        type: 'income',
        category: 'Salary',
        amount: 85000,
        description: 'TechCorp Salary Credit',
        date: d(2),
        tags: ['demo-showcase', 'salary'],
        status: 'confirmed',
      },
      {
        userId,
        type: 'income',
        category: 'Investment',
        amount: 14500,
        description: 'Dividend Payout - Mutual Funds',
        date: d(5),
        tags: ['demo-showcase'],
        status: 'confirmed',
      },
      {
        userId,
        type: 'expense',
        category: 'Food & Dining',
        amount: 1250,
        description: 'Starbucks Coffee & Snacks',
        date: d(1),
        tags: ['demo-showcase'],
        status: 'confirmed',
        metadata: { cleanMerchant: 'Starbucks Indiranagar' },
      },
      {
        userId,
        type: 'expense',
        category: 'Groceries',
        amount: 2840,
        description: 'Blinkit Grocery Order',
        date: d(3),
        tags: ['demo-showcase'],
        status: 'confirmed',
      },
      {
        userId,
        type: 'expense',
        category: 'Travel',
        amount: 450,
        description: 'Uber Ride to Tech Park',
        date: d(4),
        tags: ['demo-showcase'],
        status: 'confirmed',
      },
      {
        userId,
        type: 'expense',
        category: 'Shopping',
        amount: 3499,
        description: 'Amazon Electronics & Desk Lamp',
        date: d(7),
        tags: ['demo-showcase'],
        status: 'confirmed',
      },
      {
        userId,
        type: 'expense',
        category: 'Bills & Utilities',
        amount: 2400,
        description: 'Electricity BESCOM Bill',
        date: d(8),
        tags: ['demo-showcase'],
        status: 'confirmed',
      },
      {
        userId,
        type: 'expense',
        category: 'Entertainment',
        amount: 980,
        description: 'PVR IMAX Movie Tickets',
        date: d(10),
        tags: ['demo-showcase'],
        status: 'confirmed',
      },
      {
        userId,
        type: 'expense',
        category: 'Investment',
        amount: 15000,
        description: 'Monthly SIP - Nifty 50 Index Fund',
        date: d(12),
        tags: ['demo-showcase', 'investment'],
        status: 'confirmed',
      },

      // Unconfirmed Drafts for AWS Textract EOD Review Banner
      {
        userId,
        type: 'expense',
        category: 'Food & Dining',
        amount: 680,
        description: 'Blue Tokai Coffee Roasters',
        date: d(0),
        tags: ['demo-showcase', 'textract-ocr'],
        status: 'draft',
        metadata: {
          scanned: true,
          vendor: 'Blue Tokai Coffee Roasters',
          confidence: 94.5,
          lineItems: [
            { name: 'Cold Brew Blend', quantity: 1, price: 320 },
            { name: 'Almond Croissant', quantity: 1, price: 360 },
          ],
        },
      },
      {
        userId,
        type: 'expense',
        category: 'Groceries',
        amount: 1420,
        description: 'Nature Basket Supermarket',
        date: d(0),
        tags: ['demo-showcase', 'textract-ocr'],
        status: 'draft',
        metadata: {
          scanned: true,
          vendor: 'Nature Basket',
          confidence: 88.0,
          lineItems: [
            { name: 'Greek Yogurt', quantity: 2, price: 400 },
            { name: 'Sourdough Bread', quantity: 1, price: 220 },
            { name: 'Avocados Pack', quantity: 1, price: 800 },
          ],
        },
      },

      // Previous Month Activity (for Comparative Analytics)
      {
        userId,
        type: 'income',
        category: 'Salary',
        amount: 85000,
        description: 'TechCorp Salary Credit',
        date: d(32),
        tags: ['demo-showcase'],
        status: 'confirmed',
      },
      {
        userId,
        type: 'expense',
        category: 'Food & Dining',
        amount: 4800,
        description: 'Weekend Dining & Cafes',
        date: d(35),
        tags: ['demo-showcase'],
        status: 'confirmed',
      },
      {
        userId,
        type: 'expense',
        category: 'Groceries',
        amount: 6200,
        description: 'Monthly Supermarket Provisions',
        date: d(38),
        tags: ['demo-showcase'],
        status: 'confirmed',
      },
      {
        userId,
        type: 'expense',
        category: 'Travel',
        amount: 3200,
        description: 'Fuel & Cab Commutes',
        date: d(40),
        tags: ['demo-showcase'],
        status: 'confirmed',
      },
      {
        userId,
        type: 'expense',
        category: 'Investment',
        amount: 15000,
        description: 'Monthly SIP',
        date: d(42),
        tags: ['demo-showcase'],
        status: 'confirmed',
      },
    ];

    await Transaction.insertMany(demoTransactions);

    // 2. Active Budgets
    const demoBudgets = [
      {
        userId,
        category: 'Food & Dining',
        limit: 8000,
        month: currentMonth,
        year: currentYear,
      },
      {
        userId,
        category: 'Groceries',
        limit: 7500,
        month: currentMonth,
        year: currentYear,
      },
      {
        userId,
        category: 'Travel',
        limit: 4000,
        month: currentMonth,
        year: currentYear,
      },
      {
        userId,
        category: 'Shopping',
        limit: 6000,
        month: currentMonth,
        year: currentYear,
      },
    ];
    await Budget.insertMany(demoBudgets);

    // 3. Financial Goals
    const demoGoals = [
      {
        userId,
        title: 'Emergency Reserve (6 Months)',
        targetAmount: 200000,
        savedAmount: 145000,
        deadline: new Date(currentYear, 11, 31),
        status: 'active',
      },
      {
        userId,
        title: 'Japan Autumn Expedition',
        targetAmount: 180000,
        savedAmount: 92000,
        deadline: new Date(currentYear + 1, 9, 15),
        status: 'active',
      },
      {
        userId,
        title: 'New M3 MacBook Pro',
        targetAmount: 160000,
        savedAmount: 160000,
        deadline: new Date(currentYear, 2, 1),
        status: 'completed',
      },
    ];
    await Goal.insertMany(demoGoals);

    // 4. Recurring Subscriptions
    const demoRecurring = [
      {
        userId,
        name: 'Netflix 4K Ultra',
        amount: 649,
        type: 'expense',
        category: 'Bills & Utilities',
        frequency: 'monthly',
        billingDay: 18,
        nextDueDate: new Date(currentYear, now.getMonth(), 18),
        paymentMethod: 'Credit Card',
        status: 'active',
      },
      {
        userId,
        name: 'Spotify Premium Family',
        amount: 179,
        type: 'expense',
        category: 'Entertainment',
        frequency: 'monthly',
        billingDay: 24,
        nextDueDate: new Date(currentYear, now.getMonth(), 24),
        paymentMethod: 'UPI',
        status: 'active',
      },
      {
        userId,
        name: 'Cult.fit Gym & Fitness',
        amount: 2200,
        type: 'expense',
        category: 'Healthcare',
        frequency: 'monthly',
        billingDay: 5,
        nextDueDate: new Date(currentYear, now.getMonth() + 1, 5),
        paymentMethod: 'Auto-Debit',
        status: 'active',
      },
    ];
    await RecurringTemplate.insertMany(demoRecurring);

    // 5. Rich Collaborative Split Group (Goa Trip with Simplified Debts)
    const memberYouId = new mongoose.Types.ObjectId();
    const memberAmanId = new mongoose.Types.ObjectId();
    const memberRiyaId = new mongoose.Types.ObjectId();
    const memberKunalId = new mongoose.Types.ObjectId();

    const goaTrip = new SplitGroup({
      userId,
      name: 'Goa Vacation 2026',
      isTrip: true,
      tripStatus: 'active',
      currency: 'INR',
      startDate: d(5),
      ownerMemberId: memberYouId,
      members: [
        { _id: memberYouId, name: req.user.name || 'You', email: req.user.email, role: 'owner', status: 'active', userId },
        { _id: memberAmanId, name: 'Aman Sharma', email: 'aman@example.com', role: 'member', status: 'active' },
        { _id: memberRiyaId, name: 'Riya Patel', email: 'riya@example.com', role: 'member', status: 'active' },
        { _id: memberKunalId, name: 'Kunal Joshi', email: 'kunal@example.com', role: 'member', status: 'active' },
      ],
      expenses: [
        {
          description: 'Candolim Beach Villa (3 Nights)',
          amount: 24000,
          paidBy: memberYouId,
          splitBetween: [memberYouId, memberAmanId, memberRiyaId, memberKunalId],
          date: d(4),
          category: 'Travel',
          syncPersonal: false,
        },
        {
          description: 'Fisherman’s Wharf Seafood Dinner',
          amount: 6400,
          paidBy: memberAmanId,
          splitBetween: [memberYouId, memberAmanId, memberRiyaId, memberKunalId],
          date: d(3),
          category: 'Food & Dining',
          syncPersonal: false,
        },
        {
          description: 'Scuba Diving & Water Sports',
          amount: 8000,
          paidBy: memberRiyaId,
          splitBetween: [memberYouId, memberAmanId, memberRiyaId, memberKunalId],
          date: d(2),
          category: 'Entertainment',
          syncPersonal: false,
        },
        {
          description: 'Scooter Rentals & Petrol',
          amount: 3600,
          paidBy: memberKunalId,
          splitBetween: [memberYouId, memberAmanId, memberRiyaId, memberKunalId],
          date: d(1),
          category: 'Travel',
          syncPersonal: false,
        },
      ],
      settlements: [],
    });

    await goaTrip.save();

    res.json({
      success: true,
      message: 'Demo showcase data successfully loaded! 3 months of transactions, budgets, goals, and trip settlements are live.',
      data: {
        transactionsCount: demoTransactions.length,
        budgetsCount: demoBudgets.length,
        goalsCount: demoGoals.length,
        activeTrip: goaTrip.name,
      },
    });
  } catch (error) {
    console.error('Failed to seed demo data:', error);
    res.status(500).json({ success: false, message: 'Failed to seed demo showcase data' });
  }
};

/**
 * Reset Demo Data
 */
exports.resetDemoData = async (req, res) => {
  try {
    const userId = req.user._id;
    await Promise.all([
      Transaction.deleteMany({ userId, tags: 'demo-showcase' }),
      SplitGroup.deleteMany({ userId, name: { $in: ['Goa Vacation 2026', 'Flat 402 Roommates'] } }),
    ]);

    res.json({
      success: true,
      message: 'Demo showcase data cleared.',
    });
  } catch (error) {
    console.error('Failed to reset demo data:', error);
    res.status(500).json({ success: false, message: 'Failed to reset demo data' });
  }
};
