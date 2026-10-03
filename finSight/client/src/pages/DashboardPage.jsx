import { useState } from 'react';
import useFetch from '../hooks/useFetch.js';
import Card from '../components/Card.jsx';
import HeroSafeToSpend from '../components/HeroSafeToSpend.jsx';
import ReviewTray from '../components/ReviewTray.jsx';
import QuickAddBar from '../components/QuickAddBar.jsx';
import InsightCard from '../components/InsightCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Modal from '../components/Modal.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import NaturalLanguageQuickAdd from '../components/NaturalLanguageQuickAdd.jsx';
import BankAlertBox from '../components/BankAlertBox.jsx';
import ReceiptScannerBox from '../components/ReceiptScannerBox.jsx';
import RecurringTemplatesWidget from '../components/RecurringTemplatesWidget.jsx';
import TripModeWidget from '../components/TripModeWidget.jsx';
import api from '../api/axios.js';

const DashboardPage = () => {
  const [refreshCount, setRefreshCount] = useState(0);
  const [quickAddPrefill, setQuickAddPrefill] = useState('');

  // Primary finance data
  const { data: summary, loading: loadingSummary } = useFetch(
    '/analytics/summary',
    {},
    [refreshCount]
  );
  const { data: budgets, loading: loadingBudgets } = useFetch('/budgets', {}, [refreshCount]);
  const { data: goals, loading: loadingGoals } = useFetch('/goals', {}, [refreshCount]);
  const { data: draftsData, loading: loadingDrafts } = useFetch(
    '/transactions/drafts',
    {},
    [refreshCount]
  );
  const {
    data: txData,
    loading: loadingTx,
    error: errorTx,
    setData: setTxData,
  } = useFetch('/transactions?limit=5&page=1', {}, [refreshCount]);

  // Modal quick entry state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('nl');
  const [saving, setSaving] = useState(false);

  const drafts = draftsData || [];
  const recentTransactions = txData?.items ?? [];

  // Calculate total budget limits and upcoming commitments
  const totalBudgetLimits = Array.isArray(budgets)
    ? budgets.reduce((sum, b) => sum + (Number(b.limit) || 0), 0)
    : 0;

  const displayBudgets =
    budgets && budgets.length > 0
      ? budgets.slice(0, 3)
      : [
          { category: 'Food & Dining', limit: 8000, spent: 5420 },
          { category: 'Groceries', limit: 6000, spent: 3900 },
          { category: 'Entertainment', limit: 3000, spent: 1850 },
        ];

  const displayGoals = goals && goals.length > 0 ? goals : [];

  const handleTransactionCreated = (newTx) => {
    setRefreshCount((c) => c + 1);
    if (newTx) {
      setTxData((prev) => ({
        ...(prev || {}),
        items: [newTx, ...(prev?.items || [])].slice(0, 5),
      }));
    }
  };

  const handleManualAddSubmit = async (payload) => {
    setSaving(true);
    try {
      const res = await api.post('/transactions', payload);
      if (res.data?.success) {
        handleTransactionCreated(res.data.data);
        setModalOpen(false);
      }
    } catch {
      // error handled in form
    } finally {
      setSaving(false);
    }
  };

  // QuickAddBar interactions
  const handleQuickAddSubmit = (text) => {
    setQuickAddPrefill(text);
    setModalTab('nl');
    setModalOpen(true);
  };

  const handleQuickAddVoice = () => {
    setQuickAddPrefill('');
    setModalTab('nl');
    setModalOpen(true);
  };

  const handleQuickAddScan = () => {
    setModalTab('receipt');
    setModalOpen(true);
  };

  return (
    <div className="calm-ledger-dashboard" style={{ paddingBottom: '5rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Overview
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Financial snapshot for this month
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setQuickAddPrefill('');
            setModalTab('nl');
            setModalOpen(true);
          }}
          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
        >
          + Add transaction
        </button>
      </div>

      {/* 1. Hero Safe to Spend Card */}
      <div style={{ marginBottom: '1.5rem' }}>
        <HeroSafeToSpend
          income={summary?.totalIncome || 0}
          spent={summary?.totalExpense || 0}
          budgetTotal={totalBudgetLimits}
          loading={loadingSummary}
        />
      </div>

      {/* 2. Needs-Review Tray (Swipeable cards with confirm/edit) */}
      <ReviewTray
        drafts={drafts}
        onDraftConfirmed={() => setRefreshCount((c) => c + 1)}
        onDraftsUpdated={() => setRefreshCount((c) => c + 1)}
      />

      {/* Active Trip Mode banner (if user is on a trip) */}
      <TripModeWidget onTripChanged={() => setRefreshCount((c) => c + 1)} />

      {/* 3. Below the fold: 2-column responsive layout (Main Column + Narrow Right Column) */}
      <div
        className="dashboard-main-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* LEFT / MAIN COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Plain-Language Insight Card */}
          <InsightCard
            title="Food & Dining is up 28% vs last month"
            detail="You have spent ₹6,420 on dining out this month compared to ₹5,010 at this point last month."
            trend="up"
            category="Food & Dining"
          />

          {/* Budget Adherence Progress Bars */}
          <Card style={{ padding: '1.25rem 1.4rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Budget Limits
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: 600 }}>
                  Active Categories
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-primary-light)',
                  fontWeight: 600,
                }}
              >
                {displayBudgets.length} budgets tracked
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {displayBudgets.map((b) => {
                const percent = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
                const isOver = percent > 90;
                return (
                  <div key={b.category}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {b.category}
                      </span>
                      <span
                        className="num-tabular"
                        style={{
                          fontWeight: 600,
                          color: isOver ? 'var(--color-warning)' : 'var(--text-secondary)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        ₹{Number(b.spent).toLocaleString('en-IN')} / ₹{Number(b.limit).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <ProgressBar
                      value={percent}
                      tone={percent >= 100 ? 'negative' : percent > 85 ? 'warning' : 'primary'}
                      height={6}
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent Transactions List */}
          <Card style={{ padding: '1.25rem 1.4rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.85rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Activity
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: 600 }}>
                  Recent Transactions
                </h3>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '0.72rem' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '0.72rem' }}>Description</th>
                    <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '0.72rem' }}>Category</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '0.72rem' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTx && (
                    <tr>
                      <td colSpan="4" style={{ padding: '1.2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading activity...
                      </td>
                    </tr>
                  )}
                  {!loadingTx && recentTransactions.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No transactions recorded yet this month.
                      </td>
                    </tr>
                  )}
                  {recentTransactions.map((t) => {
                    const isIncome = t.type === 'income';
                    return (
                      <tr
                        key={t._id}
                        style={{ borderBottom: '1px solid var(--divider-color)' }}
                      >
                        <td style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '8px 0', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {t.description || '—'}
                        </td>
                        <td style={{ padding: '8px 0' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-color)',
                              fontSize: '0.72rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {t.category}
                          </span>
                        </td>
                        <td
                          className="num-tabular"
                          style={{
                            padding: '8px 0',
                            textAlign: 'right',
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                            color: isIncome ? 'var(--color-positive)' : 'var(--color-negative)',
                          }}
                        >
                          {isIncome ? '+' : '−'}₹{Number(t.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT / NARROW COLUMN (Upcoming items & Savings Goals) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upcoming Payments & Recurring Templates */}
          <RecurringTemplatesWidget onTransactionLogged={handleTransactionCreated} />

          {/* Savings Goals Card */}
          <Card style={{ padding: '1.25rem 1.4rem' }}>
            <div style={{ marginBottom: '0.85rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                }}
              >
                Goals
              </span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: 600 }}>
                Savings Targets
              </h3>
            </div>

            {displayGoals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No active savings goals yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {displayGoals.slice(0, 3).map((g) => {
                  const percent = g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0;
                  return (
                    <div key={g._id || g.title}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem',
                          marginBottom: '0.3rem',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {g.title}
                        </span>
                        <span
                          className="num-tabular"
                          style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}
                        >
                          ₹{Number(g.savedAmount || 0).toLocaleString('en-IN')} / ₹{Number(g.targetAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <ProgressBar value={percent} tone="positive" height={6} />
                      <div
                        className="num-tabular"
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--color-positive)',
                          marginTop: '3px',
                          textAlign: 'right',
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {Math.round(percent)}% funded
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 4. Quick Add Bar pinned to bottom of the screen */}
      <QuickAddBar
        onSubmit={handleQuickAddSubmit}
        onVoiceClick={handleQuickAddVoice}
        onScanClick={handleQuickAddScan}
      />

      {/* Add / Import Transaction Modal */}
      <Modal
        title="Add Transaction"
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
      >
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
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
            className={modalTab === 'sms' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            onClick={() => setModalTab('sms')}
          >
            📨 Paste Bank SMS
          </button>
          <button
            type="button"
            className={modalTab === 'receipt' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            onClick={() => setModalTab('receipt')}
          >
            🧾 Scan Receipt
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

        {modalTab === 'nl' && (
          <NaturalLanguageQuickAdd
            compact
            initialText={quickAddPrefill}
            onTransactionCreated={(newTx) => {
              handleTransactionCreated(newTx);
              setModalOpen(false);
            }}
          />
        )}

        {modalTab === 'sms' && (
          <BankAlertBox
            compact
            onTransactionCreated={(newTx) => {
              handleTransactionCreated(newTx);
              setModalOpen(false);
            }}
          />
        )}

        {modalTab === 'receipt' && (
          <ReceiptScannerBox
            compact
            onTransactionCreated={(newTx) => {
              handleTransactionCreated(newTx);
              setModalOpen(false);
            }}
          />
        )}

        {modalTab === 'manual' && (
          <TransactionForm onSubmit={handleManualAddSubmit} submitting={saving} />
        )}
      </Modal>
    </div>
  );
};

export default DashboardPage;
