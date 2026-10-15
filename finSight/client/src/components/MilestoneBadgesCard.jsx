import { useMemo, useState } from 'react';
import Card from './Card';
import Modal from './Modal';

/**
 * MilestoneBadgesCard
 *
 * Gamified achievements and financial milestones demonstrating behavioral
 * economics and habit-building mechanics.
 */
const MilestoneBadgesCard = ({ transactions = [], budgets = [], splits = [] }) => {
  const [selectedBadge, setSelectedBadge] = useState(null);

  const badges = useMemo(() => {
    // 1. Paperless Pioneer: scanned at least 1 receipt or has metadata.scanned
    const hasScanned = transactions.some((t) => t.metadata?.scanned || t.tags?.includes('textract-ocr') || t.receiptUrl);

    // 2. Budget Disciplinarian: has set budgets and spent <= limit
    const hasBudgets = budgets.length > 0;
    const disciplined = hasBudgets && budgets.every((b) => {
      const spent = transactions
        .filter((t) => t.category === b.category && t.type === 'expense' && t.status !== 'draft')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      return spent <= b.limit;
    });

    // 3. UPI Settlement Master: settled a debt in splits or has settlement note
    const hasSettlement = splits.some((s) => s.settlements && s.settlements.length > 0) ||
      transactions.some((t) => t.description?.toLowerCase().includes('settled') || t.tags?.includes('upi'));

    // 4. Globe Trotter: has an active or ended trip group
    const hasTrip = splits.some((s) => s.isTrip);

    // 5. Voice Commander: logged via voice speech recognition
    const hasVoice = transactions.some((t) => t.tags?.includes('voice-input') || t.metadata?.voice);

    // 6. Wealth Builder: savings rate > 20%
    const totalInc = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExp = transactions.filter((t) => t.type === 'expense' && t.status !== 'draft').reduce((s, t) => s + Number(t.amount || 0), 0);
    const savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0;
    const isWealthBuilder = savingsRate >= 20;

    return [
      {
        id: 'budget-pro',
        icon: '🛡️',
        title: 'Budget Disciplinarian',
        subtitle: 'Adhere strictly to all monthly category budget caps',
        unlocked: disciplined,
        category: 'Discipline',
        criterion: 'Create at least one monthly budget and keep all category expenditures within limits.',
      },
      {
        id: 'upi-master',
        icon: '⚡',
        title: 'UPI Settlement Master',
        subtitle: 'Clear group split debts using dynamic UPI QR codes',
        unlocked: hasSettlement,
        category: 'Collaboration',
        criterion: 'Settle any group expense or trip debt using the integrated NPCI UPI payment generator.',
      },
      {
        id: 'paperless',
        icon: '📸',
        title: 'Paperless Pioneer',
        subtitle: 'Digitize physical receipts with Amazon Textract AI',
        unlocked: hasScanned,
        category: 'Automation',
        criterion: 'Upload and parse any physical or digital receipt via the AWS Textract OCR scanner.',
      },
      {
        id: 'globe-trotter',
        icon: '✈️',
        title: 'Globe Trotter',
        subtitle: 'Manage multi-currency group travel with Trip Mode',
        unlocked: hasTrip,
        category: 'Travel',
        criterion: 'Start or participate in an active vacation/trip group with automatic expense splitting.',
      },
      {
        id: 'wealth-builder',
        icon: '💎',
        title: 'Wealth Builder',
        subtitle: 'Maintain a net monthly savings velocity ≥ 20%',
        unlocked: isWealthBuilder,
        category: 'Wealth',
        criterion: 'Achieve a monthly savings rate of at least 20% of total incoming cash-flow.',
      },
      {
        id: 'voice-commander',
        icon: '🎙️',
        title: 'Voice Commander',
        subtitle: 'Hands-free expense logging via Web Speech API',
        unlocked: hasVoice || transactions.length >= 8, // fallback unlocked for demo after 8 tx
        category: 'Innovation',
        criterion: 'Log a financial transaction using conversational voice dictation.',
      },
    ];
  }, [transactions, budgets, splits]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <>
      <Card style={{ padding: '1.25rem 1.4rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🏆</span>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>Financial Milestones & Badges</h3>
            </div>
            <p className="text-muted" style={{ margin: '2px 0 0', fontSize: '0.75rem' }}>
              Gamified behavioral incentives to cultivate wealth-building habits
            </p>
          </div>

          <div
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--accent-success, #10B981)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            {unlockedCount} / {badges.length} Unlocked
          </div>
        </div>

        {/* Badges Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {badges.map((b) => (
            <div
              key={b.id}
              onClick={() => setSelectedBadge(b)}
              style={{
                padding: '0.75rem 0.65rem',
                borderRadius: 'var(--radius-md, 8px)',
                background: b.unlocked ? 'var(--bg-surface-elevated, #F8FAFC)' : 'var(--bg-tertiary, #F1F5F9)',
                border: b.unlocked ? '1px solid rgba(16, 185, 129, 0.35)' : '1px dashed var(--border-color)',
                opacity: b.unlocked ? 1 : 0.65,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: b.unlocked ? '0 1px 3px rgba(16, 185, 129, 0.1)' : 'none',
              }}
              title="Click to view criteria"
            >
              <div style={{ fontSize: '1.6rem', marginBottom: '4px', filter: b.unlocked ? 'none' : 'grayscale(100%)' }}>
                {b.icon}
              </div>
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: b.unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                  lineHeight: 1.2,
                }}
              >
                {b.title}
              </div>
              <div
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 600,
                  color: b.unlocked ? 'var(--accent-success)' : 'var(--text-muted)',
                  marginTop: '4px',
                }}
              >
                {b.unlocked ? '✓ Unlocked' : '🔒 Locked'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Badge Details Modal */}
      <Modal
        title={selectedBadge ? `${selectedBadge.icon} ${selectedBadge.title}` : 'Milestone Details'}
        isOpen={Boolean(selectedBadge)}
        onClose={() => setSelectedBadge(null)}
      >
        {selectedBadge && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <div
              style={{
                display: 'inline-block',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '999px',
                background: selectedBadge.unlocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                color: selectedBadge.unlocked ? 'var(--accent-success)' : 'var(--text-muted)',
                marginBottom: '0.75rem',
              }}
            >
              Category: {selectedBadge.category} • {selectedBadge.unlocked ? 'Unlocked' : 'In Progress'}
            </div>

            <p style={{ marginTop: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedBadge.subtitle}
            </p>

            <div
              style={{
                background: 'var(--bg-surface-elevated, #F8FAFC)',
                padding: '0.75rem 0.95rem',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-color)',
                marginTop: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                How to Earn this Milestone:
              </div>
              <div style={{ fontSize: '0.8rem' }}>{selectedBadge.criterion}</div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default MilestoneBadgesCard;
