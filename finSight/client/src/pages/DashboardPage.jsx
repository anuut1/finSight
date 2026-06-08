import useFetch from '../hooks/useFetch.js';
import GlassCard from '../components/GlassCard.jsx';
import StatCard from '../components/StatCard.jsx';
import DonutChartWrapper from '../components/charts/DonutChartWrapper.jsx';
import Modal from '../components/Modal.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import api from '../api/axios.js';
import { useState } from 'react';

const DashboardPage = () => {
  const { data: summary, loading: loadingSummary } = useFetch('/analytics/summary', {}, []);
  const { data: categories } = useFetch('/analytics/category-breakdown', {}, []);
  const { data: health, loading: loadingHealth } = useFetch('/analytics/health-score', {}, null);
  const { data: budgets } = useFetch('/budgets', {}, []);
  const { data: goals } = useFetch('/goals', {}, []);
  const { data: txData, loading: loadingTx, error: errorTx, setData: setTxData } = useFetch(
    '/transactions?limit=5&page=1',
    {},
    []
  );

  const [modalOpen, setModalOpen] = useState(false);
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

  const summaryLoading = loadingSummary;

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const netSavings = summary?.netSavings ?? 0;

  const catData =
    categories?.map((c) => ({
      category: c.category,
      total: c.total,
    })) ?? [];

  // Fallbacks for budgets and goals if none are configured in database yet
  const displayBudgets = budgets && budgets.length > 0 ? budgets.slice(0, 2) : [
    { category: 'Groceries', limit: 5000, spent: 3200 },
    { category: 'Entertainment', limit: 2000, spent: 1500 }
  ];

  const displayGoals = goals && goals.length > 0 ? goals.slice(0, 2) : [
    { title: 'Emergency Fund', targetAmount: 100000, savedAmount: 45000 },
    { title: 'Europe Trip', targetAmount: 150000, savedAmount: 80000 }
  ];

  const healthScore = health?.score ?? 78;
  const grade = health?.grade ?? 'B';

  const getDynamicDate = (daysFromNow) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const staticPayments = [
    { name: 'Netflix', amount: 649, days: 3, logo: '🍿' },
    { name: 'Spotify', amount: 119, days: 7, logo: '🎵' },
    { name: 'Internet', amount: 899, days: 12, logo: '🌐' },
    { name: 'Electricity', amount: 1200, days: 15, logo: '⚡' },
    { name: 'ChatGPT Plus', amount: 1999, days: 20, logo: '🤖' }
  ];

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

      {/* Top Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <StatCard
          label="Total income"
          value={summaryLoading ? '...' : `₹${totalIncome.toFixed(0)}`}
          tone="positive"
          subtitle="Current month"
        />
        <StatCard
          label="Total expenses"
          value={summaryLoading ? '...' : `₹${totalExpense.toFixed(0)}`}
          tone="negative"
          subtitle="Current month"
        />
        <StatCard
          label="Net savings"
          value={summaryLoading ? '...' : `₹${netSavings.toFixed(0)}`}
          tone={netSavings >= 0 ? 'positive' : 'negative'}
          subtitle={netSavings >= 0 ? 'You are in the green' : 'Spending exceeds income'}
        />
        <GlassCard
          style={{
            padding: '1rem 1.1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
            }}
          >
            Activity
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>
            {loadingTx ? 'Loading...' : `${recentTransactions.length} recent transactions`}
          </span>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
            Last 5 items this month
          </span>
        </GlassCard>
      </div>

      {/* Middle Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '4fr 6fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Left Column (40% width) - Upcoming Payments Widget */}
        <GlassCard style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              Upcoming Payments
            </div>
            <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>
              Auto-payments and recurring subscriptions due soon
            </div>
            
            <div style={{ maxHeight: '210px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {staticPayments.map((pay) => (
                <div key={pay.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.65rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '0.45rem',
                  transition: 'transform 0.15s ease',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{pay.logo}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.8rem' }}>{pay.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due {getDynamicDate(pay.days)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent-primary-light)', fontSize: '0.8rem' }}>₹{pay.amount}</div>
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginTop: '0.1rem' }}>
                      <span style={{
                        fontSize: '0.6rem',
                        padding: '1px 5px',
                        background: 'var(--bg-light)',
                        color: 'var(--accent-primary)',
                        borderRadius: '999px',
                        fontWeight: 600
                      }}>AutoPay</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{pay.days}d</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <a href="/analytics" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-primary-light)' }}>
                View All →
              </a>
            </div>
            
            {/* Smart Summary Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              marginTop: '0.75rem',
              borderTop: '1px solid var(--divider-color)',
              paddingTop: '0.75rem'
            }}>
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '0.5rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Monthly Recurring</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.1rem' }}>₹4,866</div>
              </div>
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '0.5rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Potential Annual</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.1rem' }}>₹58,392</div>
              </div>
            </div>
          </div>
          
          {/* Subscription Alert */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--bg-light)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.65rem',
            marginTop: '0.75rem'
          }}>
            <span style={{ fontSize: '0.9rem' }}>⚠️</span>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
              <strong>Subscription Review:</strong> You haven't used Spotify recently. Savings: <strong style={{ color: 'var(--color-expense)' }}>₹119/month</strong>
            </div>
          </div>
        </GlassCard>

        {/* Right Column (60% width) - Spending by Category, Health, Budget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <DonutChartWrapper
              title="Spending by category"
              data={catData}
              dataKeyName="category"
              dataKeyValue="total"
            />
            
            {/* Financial Health Score Card */}
            <GlassCard style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.2rem' }}>
                  Financial Health
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>
                  Based on savings, budgets, and consistency.
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: '50%',
                    background: `conic-gradient(var(--accent-primary) ${healthScore * 3.6}deg, rgba(156, 145, 159, 0.15) 0deg)`,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: '50%',
                      background: 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {loadingHealth ? '-' : healthScore}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.6rem' }}>
                      Score
                    </div>
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary-light)' }}>
                    Grade {grade}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.74rem', marginTop: '0.25rem', lineHeight: 1.3 }}>
                    {healthScore >= 80 ? 'Excellent financial management. Keep it up!' : 'Stable progress, but watch your category budgets.'}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
          
          {/* Budget Progress Card */}
          <GlassCard style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  Budget Adherence
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Limits and spending across top categories
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {displayBudgets.map((b) => {
                const percent = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
                return (
                  <div key={b.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{b.category}</span>
                      <span className="text-muted">₹{b.spent.toFixed(0)} / ₹{b.limit.toFixed(0)}</span>
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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {displayGoals.map((g) => {
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
        </GlassCard>
      </div>

      <Modal
        title="Quick add transaction"
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
      >
        <TransactionForm onSubmit={handleAddTransaction} submitting={saving} />
      </Modal>
    </>
  );
};

export default DashboardPage;
