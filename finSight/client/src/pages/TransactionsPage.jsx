import { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import Modal from '../components/Modal.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
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
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Transactions</h1>
          <p className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
            Search, filter, and manage every income and expense line.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openNewModal}>
          + Add transaction
        </button>
      </div>

      <GlassCard style={{ padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            name="type"
            value={filters.type}
            onChange={handleChangeFilter}
            className="input-glass"
            style={{ flex: '1 1 120px' }}
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
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
            style={{ flex: '1 1 150px' }}
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChangeFilter}
            className="input-glass"
            style={{ flex: '1 1 150px' }}
          />
          <button
            type="button"
            className="btn-primary"
            style={{ flex: '0 0 auto' }}
            onClick={applyFilters}
          >
            Apply filters
          </button>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: '1rem 1.2rem' }}>
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
                <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Mood</th>
                <th style={{ textAlign: 'right', paddingBottom: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" style={{ padding: '0.75rem 0' }} className="text-muted">
                    Loading transactions...
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan="6" style={{ padding: '0.75rem 0' }} className="text-muted">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && items.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '0.75rem 0' }} className="text-muted">
                    No transactions found.
                  </td>
                </tr>
              )}
              {items.map((t) => (
                <tr key={t._id}>
                  <td style={{ padding: '0.5rem 0', whiteSpace: 'nowrap' }}>
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.5rem 0' }}>{t.description || '—'}</td>
                  <td style={{ padding: '0.5rem 0' }}>{t.category}</td>
                  <td
                    style={{
                      padding: '0.5rem 0',
                      textAlign: 'right',
                      color:
                        t.type === 'income' ? 'var(--accent-teal)' : 'var(--accent-red)',
                    }}
                  >
                    {t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(0)}
                  </td>
                  <td style={{ padding: '0.5rem 0' }}>
                    <span
                      className="badge"
                      style={{
                        background:
                          t.mood === 'happy'
                            ? 'rgba(0,212,170,0.1)'
                            : t.mood === 'stressed'
                            ? 'rgba(255,107,107,0.1)'
                            : 'rgba(255,255,255,0.05)',
                        color:
                          t.mood === 'happy'
                            ? 'var(--accent-teal)'
                            : t.mood === 'stressed'
                            ? 'var(--accent-red)'
                            : 'var(--text-muted)',
                      }}
                    >
                      {t.mood ? t.mood.charAt(0).toUpperCase() + t.mood.slice(1) : 'Neutral'}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(t)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--accent-blue)',
                        cursor: 'pointer',
                        marginRight: '0.5rem',
                        fontSize: '0.8rem',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t._id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--accent-red)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.75rem',
            fontSize: '0.8rem',
          }}
        >
          <span className="text-muted">
            Page {pagination.page} of {pagination.pages || 1}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-primary"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={pagination.page >= (pagination.pages || 1)}
              onClick={() =>
                setPage((p) => (pagination.pages ? Math.min(pagination.pages, p + 1) : p + 1))
              }
            >
              Next
            </button>
          </div>
        </div>
      </GlassCard>

      <Modal
        title={editing ? 'Edit transaction' : 'Add transaction'}
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
      >
        <TransactionForm initialValues={editing} onSubmit={handleSave} submitting={saving} />
      </Modal>
    </>
  );
};

export default TransactionsPage;

