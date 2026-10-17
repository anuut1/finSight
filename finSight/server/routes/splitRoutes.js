const express = require('express');
const {
  getGroups,
  createGroup,
  addExpense,
  addSettlement,
  deleteGroup,
  getActiveTrip,
  startTrip,
  endTrip,
  getTripSummary,
  getUpiDrafts,
  createUpiDraft,
  assignUpiDraft,
} = require('../controllers/splitController');
const { validate, z } = require('../middleware/validate');

const router = express.Router();

const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required'),
  members: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Member name is required'),
        email: z.string().trim().optional(),
      })
    )
    .optional(),
});

const addExpenseSchema = z.object({
  description: z.string().trim().min(1, 'Expense description is required'),
  amount: z.coerce.number().positive('Expense amount must be positive'),
  paidBy: z.string().min(1, 'Paid by member is required'),
  splitBetween: z.array(z.string()).min(1, 'At least one participant required'),
  date: z.union([z.string(), z.date()]).refine((val) => !isNaN(new Date(val).getTime()), {
    message: 'Invalid expense date',
  }),
  category: z.string().optional(),
  syncPersonal: z.boolean().optional(),
});

const addSettlementSchema = z.object({
  from: z.string().min(1, 'From member is required'),
  to: z.string().min(1, 'To member is required'),
  amount: z.coerce.number().positive('Settlement amount must be positive'),
  date: z.union([z.string(), z.date()]).refine((val) => !isNaN(new Date(val).getTime()), {
    message: 'Invalid settlement date',
  }),
  note: z.string().optional(),
});

const startTripSchema = z.object({
  name: z.string().trim().min(1, 'Trip name is required'),
  members: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Member name is required'),
        email: z.string().trim().optional(),
      })
    )
    .optional(),
  currency: z.string().optional(),
});

const createUpiDraftSchema = z.object({
  amount: z.coerce.number().positive('Draft amount must be positive'),
  rawText: z.string().optional(),
  upiRef: z.string().optional(),
});

router.get('/trips/active', getActiveTrip);
router.post('/trips/start', validate(startTripSchema), startTrip);
router.post('/trips/:groupId/end', endTrip);
router.get('/trips/:groupId/summary', getTripSummary);

router.get('/groups', getGroups);
router.post('/groups', validate(createGroupSchema), createGroup);
router.delete('/groups/:groupId', deleteGroup);
router.post('/groups/:groupId/expenses', validate(addExpenseSchema), addExpense);
router.post('/groups/:groupId/settlements', validate(addSettlementSchema), addSettlement);

// Trip-mode UPI Drafts & Polls
router.get('/groups/:groupId/upi-drafts', getUpiDrafts);
router.post('/groups/:groupId/upi-drafts', validate(createUpiDraftSchema), createUpiDraft);
router.post('/groups/:groupId/upi-drafts/:draftId/assign', assignUpiDraft);

module.exports = router;
