import { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Modal from '../components/Modal.jsx';
import api from '../api/axios.js';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    targetAmount: '',
    savedAmount: '',
    deadline: '',
  });
  const [saving, setSaving] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  const [fundAmount, setFundAmount] = useState('');

  const fetchGoals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/goals');
      if (res.data?.success) {
        setGoals(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
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
      const payload = {
        title: form.title,
        targetAmount: Number(form.targetAmount),
        savedAmount: form.savedAmount ? Number(form.savedAmount) : 0,
        deadline: form.deadline,
      };
      const res = await api.post('/goals', payload);
      if (res.data?.success) {
        setGoals((prev) => [...prev, res.data.data]);
        setForm({ title: '', targetAmount: '', savedAmount: '', deadline: '' });
        setModalOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create goal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      const res = await api.delete(`/goals/${id}`);
      if (res.data?.success) {
        setGoals((prev) => prev.filter((g) => g._id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete goal');
    }
  };

  const handleAddFunds = async () => {
    if (!activeGoal) return;
    const amount = Number(fundAmount);
    if (!amount) return;
    try {
      const newSaved = (activeGoal.savedAmount || 0) + amount;
      const status = newSaved >= activeGoal.targetAmount ? 'completed' : activeGoal.status;
      const res = await api.put(`/goals/${activeGoal._id}`, {
        savedAmount: newSaved,
        status,
      });
      if (res.data?.success) {
        setGoals((prev) =>
          prev.map((g) => (g._id === activeGoal._id ? res.data.data : g))
        );
        setActiveGoal(null);
        setFundAmount('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add funds');
    }
  };

  const openFundModal = (goal) => {
    setActiveGoal(goal);
    setFundAmount('');
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
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Goals</h1>
          <p className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
            Track long‑term savings targets and celebrate progress.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          + Add goal
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
            Loading goals...
          </p>
        </GlassCard>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '1rem',
          }}
        >
          {goals.length === 0 && (
            <GlassCard style={{ padding: '1rem 1.2rem' }}>
              <p className="text-muted" style={{ margin: 0 }}>
                No goals yet. Add one to start tracking a target.
              </p>
            </GlassCard>
          )}
          {goals.map((g) => {
            const progress =
              g.targetAmount > 0
                ? Math.min(100, (g.savedAmount / g.targetAmount) * 100)
                : 0;
            const isCompleted = g.status === 'completed' || progress >= 100;

            return (
              <GlassCard key={g._id} style={{ padding: '0.9rem 1.1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.3rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{g.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Target ₹{g.targetAmount.toFixed(0)}
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: isCompleted
                        ? 'rgba(0,212,170,0.1)'
                        : 'rgba(79,142,247,0.15)',
                      color: isCompleted ? 'var(--accent-teal)' : 'var(--accent-blue)',
                    }}
                  >
                    {isCompleted ? 'Completed' : 'Active'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                  Saved ₹{g.savedAmount.toFixed(0)} ({progress.toFixed(0)}%)
                </div>
                <ProgressBar value={progress} />
                <div
                  style={{
                    marginTop: '0.3rem',
                    fontSize: '0.75rem',
                  }}
                  className="text-muted"
                >
                  Deadline {new Date(g.deadline).toLocaleDateString()}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.5rem',
                  }}
                >
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                    onClick={() => openFundModal(g)}
                  >
                    Add funds
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(g._id)}
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
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal
        title="Create goal"
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="input-glass"
              placeholder="e.g. Emergency fund"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Target amount
            </label>
            <input
              type="number"
              name="targetAmount"
              value={form.targetAmount}
              onChange={handleChange}
              className="input-glass"
              placeholder="e.g. 50000"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Already saved (optional)
            </label>
            <input
              type="number"
              name="savedAmount"
              value={form.savedAmount}
              onChange={handleChange}
              className="input-glass"
              placeholder="e.g. 10000"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Deadline
            </label>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className="input-glass"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save goal'}
          </button>
        </form>
      </Modal>

      <Modal
        title={activeGoal ? `Add funds to ${activeGoal.title}` : 'Add funds'}
        isOpen={!!activeGoal}
        onClose={() => setActiveGoal(null)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
            Current saved: ₹{activeGoal?.savedAmount.toFixed(0) ?? 0}
          </div>
          <input
            type="number"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            className="input-glass"
            placeholder="Amount to add"
          />
          <button className="btn-primary" type="button" onClick={handleAddFunds}>
            Add funds
          </button>
        </div>
      </Modal>
    </>
  );
};

export default GoalsPage;

