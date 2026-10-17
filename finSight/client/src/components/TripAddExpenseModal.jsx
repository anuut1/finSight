import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from './Modal';
import Button from './Button';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * One-step "Add expense" for an active trip.
 * Defaults: paid by the host, split equally among everyone. Just type what and how much.
 */
const TripAddExpenseModal = ({ isOpen, onClose, trip, symbol = '₹', onAdded }) => {
  const members = trip?.members || [];
  const [splitMode, setSplitMode] = useState('pick'); // 'pick' | 'poll'
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitBetween, setSplitBetween] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const ids = (trip?.members || []).map((m) => m._id);
    setSplitMode('pick');
    setDescription('');
    setAmount('');
    setPaidBy(ids[0] || '');
    setSplitBetween(ids);
    setError('');
  }, [isOpen, trip?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id) =>
    setSplitBetween((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allSelected = members.length > 0 && splitBetween.length === members.length;
  const share = splitBetween.length && Number(amount) > 0 ? Number(amount) / splitBetween.length : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return setError('Add a short description, e.g. "Lunch".');
    if (!(Number(amount) > 0)) return setError('Enter a valid amount.');
    setSaving(true);
    setError('');

    try {
      if (splitMode === 'poll') {
        const draftRes = await api.post(`/splits/groups/${trip._id}/upi-drafts`, {
          amount: Number(amount),
          merchant: description.trim(),
          category: 'Shared',
          date: today(),
        });
        if (draftRes.data?.data?._id) {
          await api.post(`/splits/groups/${trip._id}/upi-drafts/${draftRes.data.data._id}/assign`, {
            mode: 'poll',
            paidBy,
            question: `Did you share the expense of ${symbol}${amount} for ${description.trim()}?`,
          });
        }
        if (onAdded) onAdded(draftRes.data?.data);
        onClose();
      } else {
        if (!splitBetween.length) return setError('Pick at least one person to split with.');
        const res = await api.post(`/splits/groups/${trip._id}/expenses`, {
          description: description.trim(),
          amount: Number(amount),
          paidBy,
          splitBetween,
          date: today(),
          category: 'Shared',
          syncPersonal: true,
        });
        if (res.data?.success) {
          if (onAdded) onAdded(res.data.data);
          onClose();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add the expense.');
    } finally {
      setSaving(false);
    }
  };

  const field = { display: 'flex', flexDirection: 'column', gap: '6px' };
  const label = { fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' };

  return (
    <Modal title="Add trip expense" isOpen={isOpen} onClose={() => !saving && onClose()}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Segmented Control: Pick people vs Ask everyone */}
        <div style={{ display: 'flex', borderRadius: 'var(--radius-md, 8px)', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated, rgba(255,255,255,0.03))' }}>
          <button
            type="button"
            onClick={() => setSplitMode('pick')}
            style={{
              flex: 1,
              padding: '7px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              background: splitMode === 'pick' ? 'var(--accent-primary, #6366F1)' : 'transparent',
              color: splitMode === 'pick' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            👥 Pick people
          </button>
          <button
            type="button"
            onClick={() => setSplitMode('poll')}
            style={{
              flex: 1,
              padding: '7px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              background: splitMode === 'poll' ? 'var(--accent-primary, #6366F1)' : 'transparent',
              color: splitMode === 'poll' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            📊 Ask everyone (Poll)
          </button>
        </div>

        <div style={field}>
          <label htmlFor="trip-exp-desc" style={label}>What was it for?</label>
          <input id="trip-exp-desc" className="form-input" autoFocus value={description}
            onChange={(e) => setDescription(e.target.value)} placeholder="Lunch" />
        </div>
        <div style={field}>
          <label htmlFor="trip-exp-amt" style={label}>Amount ({symbol})</label>
          <input id="trip-exp-amt" className="form-input" type="number" inputMode="decimal" min="0"
            step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="600" />
        </div>
        <div style={field}>
          <label htmlFor="trip-exp-paid" style={label}>Paid by</label>
          <select id="trip-exp-paid" className="form-input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        </div>
        {splitMode === 'pick' ? (
          <div style={field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={label}>Split between</span>
              <Button type="button" variant="ghost" size="sm"
                onClick={() => setSplitBetween(allSelected ? [] : members.map((m) => m._id))}>
                {allSelected ? 'Clear' : 'Select all'}
              </Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {members.map((m) => {
                const on = splitBetween.includes(m._id);
                return (
                  <Button key={m._id} type="button" size="sm" variant={on ? 'primary' : 'secondary'}
                    aria-pressed={on} onClick={() => toggle(m._id)}>
                    {on ? '✓ ' : ''}{m.name}
                  </Button>
                );
              })}
            </div>
            {share > 0 && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {symbol}{share.toLocaleString(undefined, { maximumFractionDigits: 2 })} each, split equally
              </span>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md, 8px)',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary, #6366F1)' }}>
              📊 Opt-in Poll Mode
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Everyone in the group will be polled: <strong>"I was part of this"</strong> or <strong>"Not me"</strong>.
              The total will be split down to the exact integer paise among members who join.
            </div>
          </div>
        )}
        {error && <div role="alert" style={{ fontSize: '0.85rem', color: 'var(--color-warning)' }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving}>
            {splitMode === 'poll' ? 'Start Poll' : 'Add expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TripAddExpenseModal;
