require('dotenv').config({ path: './finSight/server/.env' });
const mongoose = require('mongoose');

const User = require('./finSight/server/models/User');
const Transaction = require('./finSight/server/models/Transaction');
const Budget = require('./finSight/server/models/Budget');
const Goal = require('./finSight/server/models/Goal');
const SplitGroup = require('./finSight/server/models/SplitGroup');
const Friendship = require('./finSight/server/models/Friendship');
const RecurringTemplate = require('./finSight/server/models/RecurringTemplate');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas');

  const mainUser = await User.findOne({ email: 'anushree.tiwari2024@vitstudent.ac.in' });
  if (!mainUser) {
    console.error('Main user not found');
    process.exit(1);
  }
  const userId = mainUser._id;
  console.log('Seeding data for:', mainUser.name, mainUser.email, userId.toString());

  // 1. Ensure other friend users exist
  const friendEmails = [
    { name: 'Alex Partner', email: 'alex.partner@finsight.local' },
    { name: 'Pragyan Jain', email: 'pragyanjain11@gmail.com' },
    { name: 'Rohan Verma', email: 'rohan.verma@finsight.local' },
    { name: 'Priya Sharma', email: 'priya.sharma@finsight.local' }
  ];

  const friendUserMap = {};
  for (const f of friendEmails) {
    let u = await User.findOne({ email: f.email });
    if (!u) {
      u = new User({
        name: f.name,
        email: f.email,
        password: 'Password@123',
      });
      await u.save();
    }
    friendUserMap[f.name] = u;
  }

  // 2. Clear old demo data for clean state
  await Transaction.deleteMany({ userId });
  await Budget.deleteMany({ userId });
  await Goal.deleteMany({ userId });
  await SplitGroup.deleteMany({ userId });
  await Friendship.deleteMany({ $or: [{ requester: userId }, { recipient: userId }] });
  await RecurringTemplate.deleteMany({ userId });

  // 3. Populate Friendships
  for (const [name, friendObj] of Object.entries(friendUserMap)) {
    const pairKey = [userId.toString(), friendObj._id.toString()].sort().join(':');
    await Friendship.create({
      requester: userId,
      recipient: friendObj._id,
      status: 'accepted',
      pairKey
    });
  }
  console.log('Created friendships with 4 active friends');

  // 4. Populate Transactions (October 2026)
  const txList = [
    {
      userId,
      type: 'income',
      category: 'Income',
      amount: 85000,
      description: 'Monthly Engineering Stipend & Bonus',
      date: new Date('2026-10-01T10:00:00Z'),
      mood: 'happy',
      source: 'manual',
      status: 'confirmed'
    },
    {
      userId,
      type: 'expense',
      category: 'Food & Dining',
      amount: 450,
      description: 'Subway Footlong & Beverage',
      date: new Date('2026-10-05T13:30:00Z'),
      mood: 'happy',
      source: 'manual',
      status: 'confirmed'
    },
    {
      userId,
      type: 'expense',
      category: 'Food & Dining',
      amount: 2850,
      description: 'Swiggy Weekend Group Dinner',
      date: new Date('2026-10-10T20:15:00Z'),
      mood: 'happy',
      source: 'manual',
      status: 'confirmed'
    },
    {
      userId,
      type: 'expense',
      category: 'Shopping',
      amount: 3499,
      description: 'Amazon Electronics & Desk Accessories',
      date: new Date('2026-10-12T15:00:00Z'),
      mood: 'neutral',
      source: 'manual',
      status: 'confirmed'
    },
    {
      userId,
      type: 'expense',
      category: 'Utilities',
      amount: 1450,
      description: 'Airtel Xstream Fiber High-Speed Internet',
      date: new Date('2026-10-14T09:00:00Z'),
      mood: 'neutral',
      source: 'manual',
      status: 'confirmed'
    },
    {
      userId,
      type: 'expense',
      category: 'Transportation',
      amount: 820,
      description: 'Uber Ride to Tech Conference',
      date: new Date('2026-10-18T08:45:00Z'),
      mood: 'neutral',
      source: 'manual',
      status: 'confirmed'
    },
    {
      userId,
      type: 'expense',
      category: 'Entertainment',
      amount: 1200,
      description: 'IMAX Cinema Tickets - Sci-Fi Feature',
      date: new Date('2026-10-20T19:00:00Z'),
      mood: 'happy',
      source: 'manual',
      status: 'confirmed'
    },
    {
      userId,
      type: 'expense',
      category: 'Food & Dining',
      amount: 620,
      description: 'Blue Tokai Specialty Pour-over Coffee',
      date: new Date('2026-10-24T11:00:00Z'),
      mood: 'happy',
      source: 'manual',
      status: 'confirmed'
    },
    {
      userId,
      type: 'expense',
      category: 'Health & Fitness',
      amount: 1850,
      description: 'Cult.fit Fitness Pass Monthly',
      date: new Date('2026-10-25T07:30:00Z'),
      mood: 'happy',
      source: 'manual',
      status: 'confirmed'
    }
  ];
  await Transaction.insertMany(txList);
  console.log(`Created ${txList.length} transactions`);

  // 5. Populate Budgets
  const currentMonth = 10;
  const currentYear = 2026;
  const budgetList = [
    { userId, category: 'Food & Dining', limit: 12000, month: currentMonth, year: currentYear },
    { userId, category: 'Shopping', limit: 8000, month: currentMonth, year: currentYear },
    { userId, category: 'Transportation', limit: 4000, month: currentMonth, year: currentYear },
    { userId, category: 'Entertainment', limit: 3500, month: currentMonth, year: currentYear },
    { userId, category: 'Utilities', limit: 3000, month: currentMonth, year: currentYear },
    { userId, category: 'Health & Fitness', limit: 2500, month: currentMonth, year: currentYear }
  ];
  await Budget.insertMany(budgetList);
  console.log(`Created ${budgetList.length} monthly budgets`);

  // 6. Populate Goals
  const goalList = [
    {
      userId,
      title: 'Emergency Reserve Fund',
      targetAmount: 150000,
      savedAmount: 112500,
      deadline: new Date('2027-04-30T00:00:00Z'),
      status: 'active'
    },
    {
      userId,
      title: 'MacBook Pro M4 Tech Setup',
      targetAmount: 180000,
      savedAmount: 135000,
      deadline: new Date('2026-12-31T00:00:00Z'),
      status: 'active'
    },
    {
      userId,
      title: 'Goa Coastal Vacation 2026',
      targetAmount: 30000,
      savedAmount: 26500,
      deadline: new Date('2026-11-20T00:00:00Z'),
      status: 'active'
    },
    {
      userId,
      title: 'AWS Certified Solutions Architect Exam',
      targetAmount: 15000,
      savedAmount: 15000,
      deadline: new Date('2026-11-10T00:00:00Z'),
      status: 'completed'
    }
  ];
  await Goal.insertMany(goalList);
  console.log(`Created ${goalList.length} savings goals`);

  // 7. Populate Recurring Subscriptions / Bills
  const recurringList = [
    {
      userId,
      name: 'Netflix 4K UHD Plan',
      amount: 649,
      category: 'Entertainment',
      frequency: 'monthly',
      billingDay: 5,
      nextDueDate: new Date('2026-11-05T00:00:00Z'),
      paymentMethod: 'Auto-Debit',
      status: 'active'
    },
    {
      userId,
      name: 'Spotify Premium Family',
      amount: 179,
      category: 'Entertainment',
      frequency: 'monthly',
      billingDay: 8,
      nextDueDate: new Date('2026-11-08T00:00:00Z'),
      paymentMethod: 'UPI',
      status: 'active'
    },
    {
      userId,
      name: 'Amazon Prime Annual',
      amount: 1499,
      category: 'Shopping',
      frequency: 'yearly',
      billingDay: 12,
      nextDueDate: new Date('2026-12-12T00:00:00Z'),
      paymentMethod: 'Credit Card',
      status: 'active'
    },
    {
      userId,
      name: 'Cult.fit Fitness Studio',
      amount: 1850,
      category: 'Health & Fitness',
      frequency: 'monthly',
      billingDay: 15,
      nextDueDate: new Date('2026-11-15T00:00:00Z'),
      paymentMethod: 'UPI',
      status: 'active'
    },
    {
      userId,
      name: 'Airtel Xstream Fiber 300Mbps',
      amount: 1179,
      category: 'Bills & Utilities',
      frequency: 'monthly',
      billingDay: 1,
      nextDueDate: new Date('2026-11-01T00:00:00Z'),
      paymentMethod: 'UPI',
      status: 'active'
    }
  ];
  await RecurringTemplate.insertMany(recurringList);
  console.log(`Created ${recurringList.length} recurring subscription bills`);

  // 8. Populate Split Groups & Expenses
  const m1 = new mongoose.Types.ObjectId(); // Anushree
  const m2 = new mongoose.Types.ObjectId(); // Alex
  const m3 = new mongoose.Types.ObjectId(); // Pragyan
  const m4 = new mongoose.Types.ObjectId(); // Rohan

  const goaGroup = new SplitGroup({
    userId,
    name: 'Goa Coastal Vacation 2026',
    ownerMemberId: m1,
    isTrip: true,
    tripStatus: 'active',
    startDate: new Date('2026-10-20'),
    endDate: new Date('2026-10-26'),
    currency: 'INR',
    members: [
      { _id: m1, name: 'Anushree Tiwari', email: 'anushree.tiwari2024@vitstudent.ac.in', userId, role: 'owner', status: 'active' },
      { _id: m2, name: 'Alex Partner', email: 'alex.partner@finsight.local', userId: friendUserMap['Alex Partner']._id, role: 'member', status: 'active' },
      { _id: m3, name: 'Pragyan Jain', email: 'pragyanjain11@gmail.com', userId: friendUserMap['Pragyan Jain']._id, role: 'member', status: 'active' },
      { _id: m4, name: 'Rohan Verma', email: 'rohan.verma@finsight.local', userId: friendUserMap['Rohan Verma']._id, role: 'member', status: 'active' }
    ],
    expenses: [
      {
        description: 'Luxury Heritage Villa Booking (3 Nights)',
        amount: 24000,
        paidBy: m1,
        splitBetween: [m1, m2, m3, m4],
        date: new Date('2026-10-21'),
        category: 'Stay & Accommodation',
        syncPersonal: true,
        personalShareAmount: 6000
      },
      {
        description: 'Candolim Beach Shack Seafood & Mocktails',
        amount: 5600,
        paidBy: m2,
        splitBetween: [m1, m2, m3, m4],
        date: new Date('2026-10-22'),
        category: 'Dining Out',
        syncPersonal: true,
        personalShareAmount: 1400
      },
      {
        description: 'Self-Drive 4x4 Thar Rental & Island Fuel',
        amount: 7200,
        paidBy: m3,
        splitBetween: [m1, m2, m3, m4],
        date: new Date('2026-10-23'),
        category: 'Travel & Commute',
        syncPersonal: true,
        personalShareAmount: 1800
      },
      {
        description: 'Water Sports, Jet Ski & Scuba Package',
        amount: 9600,
        paidBy: m1,
        splitBetween: [m1, m2, m3, m4],
        date: new Date('2026-10-24'),
        category: 'Activities',
        syncPersonal: true,
        personalShareAmount: 2400
      }
    ],
    settlements: [
      {
        from: m2,
        to: m1,
        amount: 2500,
        date: new Date('2026-10-25'),
        note: 'UPI Partial advance settle'
      }
    ]
  });
  await goaGroup.save();

  // Also create a second split group: "Flat 402 Monthly Living"
  const f1 = new mongoose.Types.ObjectId();
  const f2 = new mongoose.Types.ObjectId();
  const flatGroup = new SplitGroup({
    userId,
    name: 'Flat 402 Living & Utilities',
    ownerMemberId: f1,
    isTrip: false,
    currency: 'INR',
    members: [
      { _id: f1, name: 'Anushree Tiwari', email: 'anushree.tiwari2024@vitstudent.ac.in', userId, role: 'owner', status: 'active' },
      { _id: f2, name: 'Pragyan Jain', email: 'pragyanjain11@gmail.com', userId: friendUserMap['Pragyan Jain']._id, role: 'member', status: 'active' }
    ],
    expenses: [
      {
        description: 'Monthly Groceries & Dairy Supplies',
        amount: 4200,
        paidBy: f1,
        splitBetween: [f1, f2],
        date: new Date('2026-10-15'),
        category: 'Groceries',
        syncPersonal: true,
        personalShareAmount: 2100
      }
    ]
  });
  await flatGroup.save();

  console.log('Created 2 split groups with rich expenses and settlements!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
