import { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Modal from '../components/Modal.jsx';
import api from '../api/axios.js';

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ category: '', limit: '' });
  const [saving, setSaving] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/budgets');
      if (res.data?.success) {
        setBudgets(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/budgets', {
        category: form.category,
        limit: Number(form.limit),
      });
      if (res.data?.success) {
        setBudgets((prev) => [...prev, res.data.data]);
        setForm({ category: '', limit: '' });
        setModalOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      const res = await api.delete(`/budgets/${id}`);
      if (res.data?.success) {
        setBudgets((prev) => prev.filter((b) => b._id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete budget');
    }
  };

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
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Budgets</h1>
          <p className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
            Allocate spending limits per category and watch your progress.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          + Add budget
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '0.75rem',
            padding: '0.6rem 0.9rem',
            borderRadius: 999,
            background: 'rgba(255, 107, 107, 0.1)',
            color: 'var(--accent-red)',
            fontSize: '0.8rem',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <GlassCard style={{ padding: '1rem 1.2rem' }}>
          <p className="text-muted" style={{ margin: 0 }}>
            Loading budgets...
          </p>
        </GlassCard>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {budgets.length === 0 && (
            <GlassCard style={{ padding: '1rem 1.2rem' }}>
              <p className="text-muted" style={{ margin: 0 }}>
                No budgets yet. Create one to start tracking.
              </p>
            </GlassCard>
          )}
          {budgets.map((b) => {
            const spent = b.spent || 0;
            const percent = b.limit > 0 ? (spent / b.limit) * 100 : 0;
            const over = percent > 100;
            const nearLimit = percent > 80;

            return (
              <GlassCard key={b._id} style={{ padding: '0.9rem 1.1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.3rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                      {b.category}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Limit ₹{b.limit.toFixed(0)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(b._id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--accent-red)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                  Spent ₹{spent.toFixed(0)} ({percent.toFixed(0)}%)
                </div>
                <ProgressBar value={percent} />
                <div
                  style={{
                    marginTop: '0.3rem',
                    fontSize: '0.75rem',
                  }}
                  className="text-muted"
                >
                  {over
                    ? 'Over budget — consider trimming this category.'
                    : nearLimit
                    ? 'Close to the limit — monitor upcoming expenses.'
                    : 'Comfortably within your limit.'}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal
        title="Create budget"
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Category
            </label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              className="input-glass"
              placeholder="e.g. Groceries"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Monthly limit
            </label>
            <input
              type="number"
              name="limit"
              value={form.limit}
              onChange={handleChange}
              className="input-glass"
              placeholder="e.g. 5000"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save budget'}
          </button>
        </form>
      </Modal>
    </>
  );
};

export default BudgetsPage;

