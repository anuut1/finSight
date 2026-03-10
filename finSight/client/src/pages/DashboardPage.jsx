import useFetch from '../hooks/useFetch.js';
import GlassCard from '../components/GlassCard.jsx';
import StatCard from '../components/StatCard.jsx';
import LineChartWrapper from '../components/charts/LineChartWrapper.jsx';
import DonutChartWrapper from '../components/charts/DonutChartWrapper.jsx';
import Modal from '../components/Modal.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import api from '../api/axios.js';
import { useState } from 'react';

const DashboardPage = () => {
  const { data: summary, loading: loadingSummary } = useFetch('/analytics/summary', {}, []);
  const { data: trend, loading: loadingTrend } = useFetch('/analytics/monthly-trend', {}, []);
  const { data: categories, loading: loadingCats } = useFetch(
    '/analytics/category-breakdown',
    {},
    []
  );
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

  const trendData =
    trend?.map((t) => ({
      label: `${t.month}/${String(t.year).slice(-2)}`,
      income: t.income,
      expense: t.expense,
    })) ?? [];

  const catData =
    categories?.map((c) => ({
      category: c.category,
      total: c.total,
    })) ?? [];

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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        <LineChartWrapper
          title="Income vs expenses — last 6 months"
          data={trendData}
          dataKeyX="label"
          dataKeyY1="income"
          dataKeyY2="expense"
          labelY1="Income"
          labelY2="Expense"
        />
        <DonutChartWrapper
          title="Spending by category"
          data={catData}
          dataKeyName="category"
          dataKeyValue="total"
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
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
              <div style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>
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

