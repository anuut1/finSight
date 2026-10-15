const demoController = require('../controllers/demoController');
const Transaction = require('../models/Transaction');
const SplitGroup = require('../models/SplitGroup');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const RecurringTemplate = require('../models/RecurringTemplate');
const mongoose = require('mongoose');

jest.mock('../models/Transaction');
jest.mock('../models/SplitGroup');
jest.mock('../models/Budget');
jest.mock('../models/Goal');
jest.mock('../models/RecurringTemplate');

describe('demoController — Showcase Seeder Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        name: 'Pragyan Faculty',
        email: 'pragyan@example.com',
      },
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  test('seedDemoData clears previous demo data and seeds new 3-month dataset', async () => {
    Transaction.deleteMany.mockResolvedValue({});
    Budget.deleteMany.mockResolvedValue({});
    Goal.deleteMany.mockResolvedValue({});
    RecurringTemplate.deleteMany.mockResolvedValue({});
    SplitGroup.deleteMany.mockResolvedValue({});

    Transaction.insertMany.mockResolvedValue([]);
    Budget.insertMany.mockResolvedValue([]);
    Goal.insertMany.mockResolvedValue([]);
    RecurringTemplate.insertMany.mockResolvedValue([]);

    // Mock SplitGroup constructor and save
    SplitGroup.mockImplementation(function (data) {
      Object.assign(this, data);
      this.save = jest.fn().mockResolvedValue(this);
    });

    await demoController.seedDemoData(req, res);

    expect(Transaction.deleteMany).toHaveBeenCalled();
    expect(Transaction.insertMany).toHaveBeenCalled();
    expect(Budget.insertMany).toHaveBeenCalled();
    expect(Goal.insertMany).toHaveBeenCalled();
    expect(RecurringTemplate.insertMany).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('Demo showcase data successfully loaded'),
        data: expect.objectContaining({
          transactionsCount: expect.any(Number),
          budgetsCount: expect.any(Number),
          goalsCount: expect.any(Number),
          activeTrip: 'Goa Vacation 2026',
        }),
      })
    );
  });

  test('resetDemoData clears demo transactions and showcase split groups', async () => {
    Transaction.deleteMany.mockResolvedValue({});
    SplitGroup.deleteMany.mockResolvedValue({});

    await demoController.resetDemoData(req, res);

    expect(Transaction.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: req.user._id,
        tags: 'demo-showcase',
      })
    );
    expect(SplitGroup.deleteMany).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Demo showcase data cleared.',
      })
    );
  });

  test('seedDemoData returns 500 when an internal database error occurs', async () => {
    Transaction.deleteMany.mockRejectedValue(new Error('DB Connection Timeout'));

    await demoController.seedDemoData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Failed to seed demo showcase data',
      })
    );
  });
});
