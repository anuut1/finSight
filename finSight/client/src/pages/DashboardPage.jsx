import useFetch from '../hooks/useFetch.js';
import GlassCard from '../components/GlassCard.jsx';
import StatCard from '../components/StatCard.jsx';
import Modal from '../components/Modal.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import NaturalLanguageQuickAdd from '../components/NaturalLanguageQuickAdd.jsx';
import TripModeWidget from '../components/TripModeWidget.jsx';
import RecurringTemplatesWidget from '../components/RecurringTemplatesWidget.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import api from '../api/axios.js';
import { useState } from 'react';

const DashboardPage = () => {
  const [refreshCount, setRefreshCount] = useState(0);
  const { data: summary, loading: loadingSummary } = useFetch('/analytics/summary', {}, [refreshCount]);
  const { data: budgets } = useFetch('/budgets', {}, [refreshCount]);
  const { data: goals } = useFetch('/goals', {}, [refreshCount]);
  const { data: txData, loading: loadingTx, error: errorTx, setData: setTxData } = useFetch(
    '/transactions?limit=5&page=1',
    {},
    [refreshCount]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('nl');
  const [saving, setSaving] = useState(false);
  const recentTransactions = txData?.items ?? [];

  const handleAddTransaction = async (payload) => {
    setSaving(true);
    try {
      const res = await api.post('/transactions', payload);
      if (res.data?.success) {
        setTxData((prev) => ({
          ...(prev || {}),
          items: [res.data.data, ...(prev?.items || [])].slice(0, 5),
        }));
        setModalOpen(false);
      }
    } catch {
      // error surface not critical in quick add
    } finally {
      setSaving(false);
    }
  };

  const handleTransactionCreated = (newTx) => {
    setRefreshCount((c) => c + 1);
    if (newTx) {
      setTxData((prev) => ({
        ...(prev || {}),
        items: [newTx, ...(prev?.items || [])].slice(0, 5),
      }));
    }
  };

  const summaryLoading = loadingSummary;
  const netSavings = summary?.netSavings ?? 0;

  // Fallbacks for budgets if none are configured in database yet
  const displayBudgets = budgets && budgets.length > 0 ? budgets.slice(0, 2) : [
    { category: 'Groceries', limit: 5000, spent: 3200 },
    { category: 'Entertainment', limit: 2000, spent: 1500 }
  ];

  const displayGoals = goals && goals.length > 0 ? goals : [];

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Overview</h1>
          <p className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
            A clear snapshot of your month: income, expenses, and recent activity.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          + Quick add transaction
        </button>
      </div>

      {/* Trip Mode Banner & Controls */}
      <TripModeWidget onTripChanged={() => setRefreshCount((c) => c + 1)} />

      {/* Natural Language Quick Add Widget */}
      <NaturalLanguageQuickAdd onTransactionCreated={handleTransactionCreated} />

      {/* Top Card Row - Shows ONLY Money Left */}
      <div style={{ marginBottom: '1.25rem', maxWidth: '340px' }}>
        <StatCard
          label="Money Left"
          value={summaryLoading ? '...' : `₹${netSavings.toLocaleString('en-IN')}`}
          tone={netSavings >= 0 ? 'positive' : 'negative'}
          subtitle="Net savings this month"
        />
      </div>

      {/* Middle Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '4fr 6fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Left Column (40% width) - Live Recurring Templates & Payments Widget */}
        <RecurringTemplatesWidget onTransactionLogged={handleTransactionCreated} />

        {/* Right Column (60% width) - Budget Only */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Budget Progress Card */}
          <GlassCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  Budget Adherence
                </div>
                <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  Limits and spending status across your top categories
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {displayBudgets.map((b) => {
                const percent = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
                return (
                  <div key={b.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.category}</span>
                      <span className="text-muted" style={{ fontWeight: 500 }}>₹{b.spent.toFixed(0)} / ₹{b.limit.toFixed(0)}</span>
                    </div>
                    <ProgressBar value={percent} />
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Bottom Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem' }}>
        {/* Left Column - Recent Transactions */}
        <GlassCard style={{ padding: '1rem 1.2rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.2rem' }}>
                Recent transactions
              </div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                Last 5 across income and expenses
              </div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
              }}
            >
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Date</th>
                  <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Description</th>
                  <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Category</th>
                  <th style={{ textAlign: 'right', paddingBottom: '0.5rem' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {loadingTx && (
                  <tr>
                    <td colSpan="4" style={{ padding: '0.75rem 0' }} className="text-muted">
                      Loading recent transactions...
                    </td>
                  </tr>
                )}
                {errorTx && !loadingTx && (
                  <tr>
                    <td colSpan="4" style={{ padding: '0.75rem 0' }} className="text-muted">
                      {errorTx}
                    </td>
                  </tr>
                )}
                {!loadingTx && !errorTx && recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '0.75rem 0' }} className="text-muted">
                      No transactions yet. Add your first one to see it here.
                    </td>
                  </tr>
                )}
                {recentTransactions.map((t) => (
                  <tr key={t._id}>
                    <td style={{ padding: '0.4rem 0', whiteSpace: 'nowrap' }}>
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.4rem 0' }}>{t.description || '—'}</td>
                    <td style={{ padding: '0.4rem 0' }}>{t.category}</td>
                    <td
                      style={{
                        padding: '0.4rem 0',
                        textAlign: 'right',
                        color:
                          t.type === 'income'
                            ? 'var(--accent-teal)'
                            : 'var(--accent-red)',
                      }}
                    >
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Right Column - Savings Goals Progress */}
        <GlassCard style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              Savings Goals
            </div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              Milestones and target progression
            </div>
          </div>
          
          {displayGoals.length === 0 ? (
            <div className="text-muted" style={{ fontSize: '0.85rem', padding: '2rem 0', textAlign: 'center' }}>
              No active goals created yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {displayGoals.slice(0, 2).map((g) => {
                const percent = g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0;
                return (
                  <div key={g.title || g._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{g.title}</span>
                      <span className="text-muted">₹{g.savedAmount.toLocaleString('en-IN')} / ₹{g.targetAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <ProgressBar value={percent} />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem', textAlign: 'right' }}>
                      {percent.toFixed(0)}% reached
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      <Modal
        title="Add Transaction"
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
      >
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            type="button"
            className={modalTab === 'nl' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            onClick={() => setModalTab('nl')}
          >
            ✨ AI / Voice Quick Add
          </button>
          <button
            type="button"
            className={modalTab === 'manual' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            onClick={() => setModalTab('manual')}
          >
            ✏️ Manual Form
          </button>
        </div>

        {modalTab === 'nl' ? (
          <NaturalLanguageQuickAdd
            compact
            onTransactionCreated={(newTx) => {
              handleTransactionCreated(newTx);
              setModalOpen(false);
            }}
          />
        ) : (
          <TransactionForm onSubmit={handleAddTransaction} submitting={saving} />
        )}
      </Modal>
    </>
  );
};

export default DashboardPage;
