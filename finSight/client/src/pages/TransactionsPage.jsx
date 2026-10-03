import { useEffect, useState } from 'react';
import Card from '../components/Card.jsx';
import Modal from '../components/Modal.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import NaturalLanguageQuickAdd from '../components/NaturalLanguageQuickAdd.jsx';
import BankAlertImportModal from '../components/BankAlertImportModal.jsx';
import ReceiptScannerModal from '../components/ReceiptScannerModal.jsx';
import UnconfirmedDraftsDrawer from '../components/UnconfirmedDraftsDrawer.jsx';
import api from '../api/axios.js';

const TransactionsPage = () => {
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [data, setData] = useState({ items: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);
      if (filters.type) params.set('type', filters.type);
      if (filters.category) params.set('category', filters.category);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await api.get(`/transactions?${params.toString()}`);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    fetchTransactions();
  };

  const handleChangeFilter = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const openNewModal = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditing(tx);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        const res = await api.put(`/transactions/${editing._id}`, payload);
        if (res.data?.success) {
          setData((prev) => ({
            ...prev,
            items: prev.items.map((t) => (t._id === editing._id ? res.data.data : t)),
          }));
        }
      } else {
        const res = await api.post('/transactions', payload);
        if (res.data?.success) {
          setData((prev) => ({
            ...prev,
            items: [res.data.data, ...prev.items].slice(0, limit),
          }));
        }
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      const res = await api.delete(`/transactions/${id}`);
      if (res.data?.success) {
        setData((prev) => ({
          ...prev,
          items: prev.items.filter((t) => t._id !== id),
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  const items = data.items || [];
  const pagination = data.pagination || { page: 1, pages: 1 };

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700 }}>Transactions</h1>
          <p className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
            Search, filter, and manage every income and expense line.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setReceiptModalOpen(true)}
            style={{ fontSize: '0.85rem' }}
          >
            🧾 Scan Receipt
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setSmsModalOpen(true)}
            style={{ fontSize: '0.85rem' }}
          >
            📨 Paste Bank SMS
          </button>
          <button type="button" className="btn-primary" onClick={openNewModal}>
            + Add transaction
          </button>
        </div>
      </div>

      <UnconfirmedDraftsDrawer onDraftsUpdated={fetchTransactions} />

      <NaturalLanguageQuickAdd onTransactionCreated={() => fetchTransactions()} />

      <Card style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            name="type"
            value={filters.type}
            onChange={handleChangeFilter}
            className="input-glass"
            style={{ flex: '1 1 120px' }}
          >
            <option value="">All types</option>
            <option value="income">Income (+)</option>
            <option value="expense">Expense (−)</option>
          </select>
          <input
            name="category"
            value={filters.category}
            onChange={handleChangeFilter}
            className="input-glass"
            placeholder="Category"
            style={{ flex: '1 1 150px' }}
          />
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChangeFilter}
            className="input-glass"
            style={{ flex: '1 1 140px' }}
            aria-label="Start date"
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChangeFilter}
            className="input-glass"
            style={{ flex: '1 1 140px' }}
            aria-label="End date"
          />
          <button
            type="button"
            className="btn-primary"
            style={{ flex: '0 0 auto' }}
            onClick={applyFilters}
          >
            Filter
          </button>
        </div>
      </Card>

      <Card style={{ padding: '1.25rem 1.4rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.86rem',
            }}
          >
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', paddingBottom: '0.65rem' }}>Date</th>
                <th style={{ textAlign: 'left', paddingBottom: '0.65rem' }}>Description</th>
                <th style={{ textAlign: 'left', paddingBottom: '0.65rem' }}>Category</th>
                <th style={{ textAlign: 'right', paddingBottom: '0.65rem' }}>Amount</th>
                <th style={{ textAlign: 'left', paddingBottom: '0.65rem', paddingLeft: '1rem' }}>Mood</th>
                <th style={{ textAlign: 'right', paddingBottom: '0.65rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" style={{ padding: '1.25rem 0', textAlign: 'center' }} className="text-muted">
                    Loading transactions...
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan="6" style={{ padding: '1.25rem 0', textAlign: 'center', color: 'var(--color-negative)' }}>
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && items.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '1.5rem 0', textAlign: 'center' }} className="text-muted">
                    No transactions found.
                  </td>
                </tr>
              )}
              {items.map((t) => {
                const isIncome = t.type === 'income';
                return (
                  <tr
                    key={t._id}
                    style={{
                      borderBottom: '1px solid var(--divider-color)',
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    <td style={{ padding: '0.65rem 0', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.65rem 0', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {t.description || '—'}
                    </td>
                    <td style={{ padding: '0.65rem 0' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm, 8px)',
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {t.category}
                      </span>
                    </td>
                    <td
                      className="num-tabular"
                      style={{
                        padding: '0.65rem 0',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        color: isIncome ? 'var(--color-positive)' : 'var(--color-negative)',
                      }}
                    >
                      {isIncome ? '+ ₹' : '− ₹'}{Number(t.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.65rem 0', paddingLeft: '1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background:
                            t.mood === 'happy'
                              ? 'var(--color-positive-bg)'
                              : t.mood === 'stressed'
                              ? 'var(--color-negative-bg)'
                              : 'var(--bg-surface-elevated)',
                          color:
                            t.mood === 'happy'
                              ? 'var(--color-positive)'
                              : t.mood === 'stressed'
                              ? 'var(--color-negative)'
                              : 'var(--text-muted)',
                          border: `1px solid ${
                            t.mood === 'happy'
                              ? 'var(--color-positive-border)'
                              : t.mood === 'stressed'
                              ? 'var(--color-negative-border)'
                              : 'var(--border-color)'
                          }`,
                        }}
                      >
                        {t.mood ? t.mood.charAt(0).toUpperCase() + t.mood.slice(1) : 'Neutral'}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        style={{
                          border: '1px solid var(--border-color)',
                          background: 'transparent',
                          color: 'var(--color-accent)',
                          cursor: 'pointer',
                          marginRight: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm, 8px)',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t._id)}
                        style={{
                          border: '1px solid rgba(244, 63, 94, 0.25)',
                          background: 'transparent',
                          color: 'var(--color-negative)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm, 8px)',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.8rem',
          }}
        >
          <span className="text-muted num-tabular">
            Page {pagination.page} of {pagination.pages || 1}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={pagination.page >= (pagination.pages || 1)}
              onClick={() =>
                setPage((p) => (pagination.pages ? Math.min(pagination.pages, p + 1) : p + 1))
              }
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      <Modal
        title={editing ? 'Edit transaction' : 'Add transaction'}
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
      >
        <TransactionForm initialValues={editing} onSubmit={handleSave} submitting={saving} />
      </Modal>

      <BankAlertImportModal
        isOpen={smsModalOpen}
        onClose={() => setSmsModalOpen(false)}
        onTransactionCreated={() => fetchTransactions()}
      />

      <ReceiptScannerModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        onTransactionCreated={() => fetchTransactions()}
      />
    </>
  );
};

export default TransactionsPage;

