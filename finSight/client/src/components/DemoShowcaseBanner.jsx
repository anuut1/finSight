import { useState } from 'react';
import api from '../api/axios';
import Button from './Button';
import { triggerConfetti } from '../utils/confetti';

/**
 * DemoShowcaseBanner
 *
 * Prominent banner providing a 1-click showcase experience for professors,
 * evaluators, and judges to see FinSight fully populated with realistic data.
 */
const DemoShowcaseBanner = ({ onDataReloaded }) => {
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  const handleSeedData = async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      const res = await api.post('/demo/seed');
      if (res.data?.success) {
        setStatusMessage('✨ Showcase data loaded! 3 months of transactions, Goa Trip, and budgets populated.');
        triggerConfetti();
        if (onDataReloaded) {
          onDataReloaded();
        }
      }
    } catch (err) {
      console.error('Failed to load showcase data:', err);
      setStatusMessage('Error loading demo data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset demo showcase data? This will clear demo-tagged transactions and split groups.')) {
      return;
    }
    setResetting(true);
    setStatusMessage('');
    try {
      const res = await api.post('/demo/reset');
      if (res.data?.success) {
        setStatusMessage('Demo data cleared.');
        if (onDataReloaded) {
          onDataReloaded();
        }
      }
    } catch (err) {
      console.error('Failed to reset demo data:', err);
      setStatusMessage('Error resetting demo data.');
    } finally {
      setResetting(false);
    }
  };

  if (isDismissed) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '0.85rem 1.2rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem',
        boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--accent-primary, #6366F1)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            flexShrink: 0,
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)',
          }}
        >
          ⚡
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Faculty & Judge Showcase Mode
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 7px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--accent-success, #10B981)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
              }}
            >
              1-Click Demo
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {statusMessage ||
              'Instantly populate 3 months of realistic transactions, 50/30/20 budgets, Goa vacation splits & pending OCR receipts.'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={handleSeedData}
          loading={loading}
          style={{
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
          }}
        >
          ⚡ Load Showcase Data
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleResetData}
          loading={resetting}
          title="Clear showcase data"
        >
          Reset
        </Button>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '0.9rem',
          }}
          title="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default DemoShowcaseBanner;
