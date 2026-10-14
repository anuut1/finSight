const {
  extractFromTextractResponse,
  normalizeAmount,
  normalizeDate,
  validateReceiptInput,
} = require('../services/textractService');

describe('textractService - Unit Tests', () => {
  describe('normalizeAmount', () => {
    test('normalizes numbers and float strings with currency symbols and commas', () => {
      expect(normalizeAmount(1250)).toBe(1250);
      expect(normalizeAmount('₹1,250.00')).toBe(1250);
      expect(normalizeAmount('$45.99')).toBe(45.99);
      expect(normalizeAmount('€ 1,299.50')).toBe(1299.5);
      expect(normalizeAmount('   345.00   ')).toBe(345);
      expect(normalizeAmount('')).toBe(0);
      expect(normalizeAmount(null)).toBe(0);
      expect(normalizeAmount(undefined)).toBe(0);
    });
  });

  describe('normalizeDate', () => {
    test('parses standard ISO date or formatted dates', () => {
      expect(normalizeDate('2026-10-03')).toBe('2026-10-03');
      expect(normalizeDate('03-Oct-2026')).toBe('2026-10-03');
      expect(normalizeDate('15/08/2026')).toBe('2026-08-15');
    });
  });

  describe('extractFromTextractResponse', () => {
    test('extracts clean shape with vendor, date, items, subtotal, tax, total, and flags low confidence items', () => {
      const mockResponse = {
        ExpenseDocuments: [
          {
            ExpenseIndex: 1,
            SummaryFields: [
              {
                Type: { Text: 'VENDOR_NAME', Confidence: 99.2 },
                ValueDetection: { Text: 'STARBUCKS INDIRANAGAR', Confidence: 99.2 },
              },
              {
                Type: { Text: 'INVOICE_RECEIPT_DATE', Confidence: 98.0 },
                ValueDetection: { Text: '2026-10-03', Confidence: 98.0 },
              },
              {
                Type: { Text: 'SUBTOTAL', Confidence: 95.5 },
                ValueDetection: { Text: '₹565.00', Confidence: 95.5 },
              },
              {
                Type: { Text: 'TAX', Confidence: 94.0 },
                ValueDetection: { Text: '₹28.25', Confidence: 94.0 },
              },
              {
                Type: { Text: 'TOTAL', Confidence: 99.0 },
                ValueDetection: { Text: '₹593.25', Confidence: 99.0 },
              },
            ],
            LineItemGroups: [
              {
                LineItemGroupIndex: 1,
                LineItems: [
                  {
                    LineItemExpenseFields: [
                      {
                        Type: { Text: 'ITEM', Confidence: 95.0 },
                        ValueDetection: { Text: 'Caffè Mocha (Grande)', Confidence: 95.0 },
                      },
                      {
                        Type: { Text: 'QUANTITY', Confidence: 92.0 },
                        ValueDetection: { Text: '1', Confidence: 92.0 },
                      },
                      {
                        Type: { Text: 'PRICE', Confidence: 97.0 },
                        ValueDetection: { Text: '₹345.00', Confidence: 97.0 },
                      },
                    ],
                  },
                  {
                    LineItemExpenseFields: [
                      {
                        Type: { Text: 'ITEM', Confidence: 96.0 },
                        ValueDetection: { Text: 'Blueberry Muffin', Confidence: 96.0 },
                      },
                      {
                        Type: { Text: 'QUANTITY', Confidence: 90.0 },
                        ValueDetection: { Text: '2', Confidence: 90.0 },
                      },
                      {
                        Type: { Text: 'PRICE', Confidence: 96.5 },
                        ValueDetection: { Text: '₹220.00', Confidence: 96.5 },
                      },
                    ],
                  },
                  {
                    // Item with low confidence (<80%)
                    LineItemExpenseFields: [
                      {
                        Type: { Text: 'ITEM', Confidence: 72.5 },
                        ValueDetection: { Text: 'Smudged Receipt Line', Confidence: 72.5 },
                      },
                      {
                        Type: { Text: 'PRICE', Confidence: 88.0 },
                        ValueDetection: { Text: '₹50.00', Confidence: 88.0 },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = extractFromTextractResponse(mockResponse);

      // Verify required shape
      expect(result).toHaveProperty('vendor', 'STARBUCKS INDIRANAGAR');
      expect(result).toHaveProperty('date', '2026-10-03');
      expect(result).toHaveProperty('subtotal', 565);
      expect(result).toHaveProperty('tax', 28.25);
      expect(result).toHaveProperty('total', 593.25);
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items).toHaveLength(3);

      // Verify items details & types
      expect(result.items[0]).toEqual({
        name: 'Caffè Mocha (Grande)',
        quantity: 1,
        price: 345,
      });
      expect(typeof result.items[0].price).toBe('number');
      expect(typeof result.items[0].quantity).toBe('number');

      expect(result.items[1]).toEqual({
        name: 'Blueberry Muffin',
        quantity: 2,
        price: 220,
      });

      expect(result.items[2]).toEqual({
        name: 'Smudged Receipt Line',
        quantity: 1, // Defaulted to 1 when missing
        price: 50,
      });

      // Verify lowConfidenceItems
      expect(Array.isArray(result.lowConfidenceItems)).toBe(true);
      expect(result.lowConfidenceItems).toHaveLength(1);
      expect(result.lowConfidenceItems[0].name).toBe('Smudged Receipt Line');
      expect(result.lowConfidenceItems[0].confidence).toBe(72.5);
    });

    test('calculates subtotal and total from items if summary fields are missing', () => {
      const mockResponse = {
        ExpenseDocuments: [
          {
            ExpenseIndex: 1,
            SummaryFields: [
              {
                Type: { Text: 'VENDOR_NAME', Confidence: 95.0 },
                ValueDetection: { Text: 'Corner Bakery', Confidence: 95.0 },
              },
            ],
            LineItemGroups: [
              {
                LineItems: [
                  {
                    LineItemExpenseFields: [
                      { Type: { Text: 'ITEM' }, ValueDetection: { Text: 'Croissant', Confidence: 95 } },
                      { Type: { Text: 'PRICE' }, ValueDetection: { Text: '120.00', Confidence: 95 } },
                    ],
                  },
                  {
                    LineItemExpenseFields: [
                      { Type: { Text: 'ITEM' }, ValueDetection: { Text: 'Latte', Confidence: 95 } },
                      { Type: { Text: 'PRICE' }, ValueDetection: { Text: '180.00', Confidence: 95 } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = extractFromTextractResponse(mockResponse);
      expect(result.subtotal).toBe(300);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(300);
      expect(result.lowConfidenceItems).toHaveLength(0);
    });

    test('throws NO_ITEMS_DETECTED error if no line items are found', () => {
      const emptyItemsResponse = {
        ExpenseDocuments: [
          {
            ExpenseIndex: 1,
            SummaryFields: [
              { Type: { Text: 'VENDOR_NAME' }, ValueDetection: { Text: 'ATM Receipt' } },
            ],
            LineItemGroups: [],
          },
        ],
      };

      expect(() => extractFromTextractResponse(emptyItemsResponse)).toThrow(
        /No line items detected on receipt/
      );
    });

    test('throws NO_DOCUMENT_FOUND error if ExpenseDocuments is empty', () => {
      expect(() => extractFromTextractResponse({})).toThrow(
        /No expense document detected/
      );
    });
  });

  describe('validateReceiptInput', () => {
    test('accepts valid JPEG, PNG, and PDF buffers', () => {
      const smallBuffer = Buffer.from('fake image content');
      expect(() => validateReceiptInput(smallBuffer, 'image/jpeg')).not.toThrow();
      expect(() => validateReceiptInput(smallBuffer, 'image/png')).not.toThrow();
      expect(() => validateReceiptInput(smallBuffer, 'application/pdf')).not.toThrow();
    });

    test('rejects HEIC with specific helpful error', () => {
      const buffer = Buffer.from('fake heic');
      expect(() => validateReceiptInput(buffer, 'image/heic')).toThrow(/HEIC format from iPhones/);
    });

    test('rejects WebP with specific error', () => {
      const buffer = Buffer.from('fake webp');
      expect(() => validateReceiptInput(buffer, 'image/webp')).toThrow(/WebP format is not supported/);
    });

    test('rejects files larger than 10MB', () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      expect(() => validateReceiptInput(largeBuffer, 'image/jpeg')).toThrow(/exceeds the 10MB limit/);
    });
  });
});
