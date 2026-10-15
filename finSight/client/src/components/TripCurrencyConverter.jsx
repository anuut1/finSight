import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

const FX_RATES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rateToInr: 86.5 },
  { code: 'EUR', name: 'Euro', symbol: '€', rateToInr: 91.2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rateToInr: 109.8 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rateToInr: 23.55 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rateToInr: 64.2 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', rateToInr: 2.45 },
];

/**
 * TripCurrencyConverter
 *
 * Live currency exchange rates and calculator for international group trips.
 */
const TripCurrencyConverter = ({ isOpen, onClose, currentTripCurrency = 'INR' }) => {
  const [foreignAmount, setForeignAmount] = useState('100');
  const [selectedCurrency, setSelectedCurrency] = useState(
    currentTripCurrency !== 'INR' ? currentTripCurrency : 'USD'
  );

  const matchedFx = FX_RATES.find((fx) => fx.code === selectedCurrency) || FX_RATES[0];
  const calculatedInr = (Number(foreignAmount || 0) * matchedFx.rateToInr).toFixed(2);

  return (
    <Modal title="💱 Travel FX Currency Calculator" isOpen={isOpen} onClose={onClose}>
      <div style={{ fontSize: '0.84rem' }}>
        <p className="text-muted" style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.78rem' }}>
          Real-time international exchange conversion for cross-border vacation expenses and split settlements.
        </p>

        {/* Interactive Converter Box */}
        <div
          style={{
            background: 'var(--bg-surface-elevated, #F8FAFC)',
            padding: '1rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                FOREIGN AMOUNT
              </label>
              <input
                type="number"
                className="input-glass"
                value={foreignAmount}
                onChange={(e) => setForeignAmount(e.target.value)}
                placeholder="Amount"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>
                CURRENCY
              </label>
              <select
                className="input-glass"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
              >
                {FX_RATES.map((fx) => (
                  <option key={fx.code} value={fx.code}>
                    {fx.code} ({fx.symbol}) - {fx.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Equal Result Display */}
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>Equivalent Indian Rupees:</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-success, #10B981)', marginTop: '2px' }}>
                ₹{Number(calculatedInr).toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              1 {matchedFx.code} = <strong>₹{matchedFx.rateToInr}</strong>
            </div>
          </div>
        </div>

        {/* Global Reference Table */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Reference Travel FX Rates
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary, #F1F5F9)', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Currency</th>
                <th style={{ padding: '6px 8px' }}>Code</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>1 Unit in INR</th>
              </tr>
            </thead>
            <tbody>
              {FX_RATES.map((fx) => (
                <tr key={fx.code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '6px 8px' }}>{fx.symbol} {fx.name}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>{fx.code}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    ₹{fx.rateToInr.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default TripCurrencyConverter;
