import { useEffect, useMemo, useState } from 'react';
import Card from '../components/Card.jsx';
import BalanceChip from '../components/BalanceChip.jsx';
import Modal from '../components/Modal.jsx';
import TripModeWidget from '../components/TripModeWidget.jsx';
import api from '../api/axios.js';
import useAuth from '../hooks/useAuth.js';

const today = new Date().toISOString().slice(0, 10);

const emptyGroupForm = {
  name: '',
  members: 'You\nFriend',
};

const emptyExpenseForm = {
  description: '',
  amount: '',
  paidBy: '',
  splitBetween: [],
  date: today,
  category: 'Shared',
  syncPersonal: true,
};

const emptySettlementForm = {
  from: '',
  to: '',
  amount: '',
  date: today,
  note: '',
};

const currency = (value) => `₹${Number(value || 0).toFixed(0)}`;

const SplitsPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [settlementForm, setSettlementForm] = useState(emptySettlementForm);

  const selectedGroup = useMemo(
    () => groups.find((group) => group._id === selectedGroupId) || groups[0],
    [groups, selectedGroupId]
  );

  useEffect(() => {
    if (!user || groupForm.members !== emptyGroupForm.members) return;

    const userLine = `${user.name || 'You'}${user.email ? `, ${user.email}` : ''}`;
    setGroupForm((prev) => ({ ...prev, members: `${userLine}\nFriend` }));
  }, [groupForm.members, user]);

  const fetchGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/splits/groups');
      if (res.data?.success) {
        setGroups(res.data.data);
        setSelectedGroupId((current) => current || res.data.data[0]?._id || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load split groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const replaceGroup = (updatedGroup) => {
    setGroups((prev) => prev.map((group) => (group._id === updatedGroup._id ? updatedGroup : group)));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const members = groupForm.members
        .split('\n')
        .map((line) => {
          const [name, email = ''] = line.split(',');
          return { name: name.trim(), email: email.trim() };
        })
        .filter((member) => member.name);

      const res = await api.post('/splits/groups', {
        name: groupForm.name,
        members,
      });

      if (res.data?.success) {
        setGroups((prev) => [res.data.data, ...prev]);
        setSelectedGroupId(res.data.data._id);
        setGroupForm(emptyGroupForm);
        setGroupModalOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setSaving(false);
    }
  };

  const openExpenseModal = () => {
    if (!selectedGroup) return;
    const memberIds = selectedGroup.members.map((member) => member._id);
    setExpenseForm({
      ...emptyExpenseForm,
      paidBy: memberIds[0] || '',
      splitBetween: memberIds,
    });
    setExpenseModalOpen(true);
  };

  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSplitMember = (memberId) => {
    setExpenseForm((prev) => {
      const selected = prev.splitBetween.includes(memberId);
      return {
        ...prev,
        splitBetween: selected
          ? prev.splitBetween.filter((id) => id !== memberId)
          : [...prev.splitBetween, memberId],
      };
    });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.post(`/splits/groups/${selectedGroup._id}/expenses`, {
        ...expenseForm,
        amount: Number(expenseForm.amount),
        syncPersonal: expenseForm.syncPersonal,
      });

      if (res.data?.success) {
        replaceGroup(res.data.data);
        setExpenseModalOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add shared expense');
    } finally {
      setSaving(false);
    }
  };

  const openSettlementModal = (debt) => {
    setSettlementForm({
      from: debt?.from || selectedGroup?.members[0]?._id || '',
      to: debt?.to || selectedGroup?.members[1]?._id || '',
      amount: debt?.amount || '',
      date: today,
      note: '',
    });
    setSettlementModalOpen(true);
  };

  const handleAddSettlement = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.post(`/splits/groups/${selectedGroup._id}/settlements`, {
        ...settlementForm,
        amount: Number(settlementForm.amount),
      });

      if (res.data?.success) {
        replaceGroup(res.data.data);
        setSettlementModalOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record settlement');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup || !window.confirm('Delete this split group?')) return;
    try {
      const res = await api.delete(`/splits/groups/${selectedGroup._id}`);
      if (res.data?.success) {
        setGroups((prev) => prev.filter((group) => group._id !== selectedGroup._id));
        setSelectedGroupId('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete group');
    }
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Split Expenses</h1>
          <p className="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
            Split shared bills and sync only your share into personal budgets.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setGroupModalOpen(true)}>
          + New group
        </button>
      </div>

      {/* Trip Mode Banner & Settlement Tool */}
      <TripModeWidget onTripChanged={() => fetchGroups()} />

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
        <Card style={{ padding: '1rem 1.2rem' }}>
          <p className="text-muted" style={{ margin: 0 }}>
            Loading split groups...
          </p>
        </Card>
      ) : groups.length === 0 ? (
        <Card style={{ padding: '1.2rem 1.4rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>No groups yet</h2>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Create a group for a trip, room, dinner, or project to start splitting costs.
          </p>
          <button type="button" className="btn-primary" onClick={() => setGroupModalOpen(true)}>
            Create your first group
          </button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: '1rem' }}>
          <Card style={{ padding: '0.9rem' }}>
            <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
              Groups
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {groups.map((group) => (
                <button
                  key={group._id}
                  type="button"
                  onClick={() => setSelectedGroupId(group._id)}
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md, 12px)',
                    border:
                      selectedGroup?._id === group._id
                        ? '1px solid var(--color-accent)'
                        : '1px solid var(--border-color)',
                    background:
                      selectedGroup?._id === group._id
                        ? 'var(--color-accent-subtle)'
                        : 'var(--bg-surface-elevated)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{group.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {group.members.length} members · {group.expenses.length} expenses
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {selectedGroup && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Trip / Group Header Card */}
              <Card style={{ padding: '1.25rem 1.4rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{selectedGroup.isTrip ? '✈️' : '👥'}</span>
                      <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {selectedGroup.name}
                      </h2>
                      {selectedGroup.isTrip && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-positive-bg)',
                            color: 'var(--color-positive)',
                            border: '1px solid var(--color-positive-border)',
                          }}
                        >
                          Trip Active
                        </span>
                      )}
                    </div>

                    {/* Member Avatars Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.65rem' }}>
                      <div style={{ display: 'flex', marginLeft: '6px' }}>
                        {selectedGroup.members.map((m, idx) => (
                          <div
                            key={m._id || m.name}
                            title={`${m.name} (${m.email || 'No email'})`}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'var(--bg-surface-elevated)',
                              border: '2px solid var(--bg-surface)',
                              color: 'var(--accent-primary-light)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              marginLeft: idx === 0 ? 0 : '-8px',
                              boxShadow: 'var(--shadow-xs)',
                            }}
                          >
                            {(m.name || '?')[0].toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        {selectedGroup.members.length} members &bull; Total spent:{' '}
                        <strong className="num-tabular" style={{ color: 'var(--text-primary)' }}>
                          ₹{selectedGroup.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toLocaleString('en-IN')}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" className="btn-primary" onClick={openExpenseModal}>
                      + Expense
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => openSettlementModal()}
                    >
                      Record Settle
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteGroup}
                      style={{
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        background: 'var(--color-negative-bg)',
                        color: 'var(--color-negative)',
                        borderRadius: 'var(--radius-md, 12px)',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>

              {/* Balances & Simplified Debts with Settle via UPI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <Card style={{ padding: '1.2rem 1.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Member Balances</h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Net balance</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {selectedGroup.memberBalances.map((member) => (
                      <div
                        key={member.memberId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 0',
                          borderBottom: '1px solid var(--divider-color)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: 'var(--bg-surface-elevated)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {(member.name || '?')[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {member.name}
                          </span>
                        </div>
                        <BalanceChip amount={member.balance} />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card style={{ padding: '1.2rem 1.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Who Owes Whom</h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Simplified settlement</span>
                  </div>
                  {selectedGroup.simplifiedDebts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--color-positive)', fontSize: '0.85rem' }}>
                      ✓ Everyone is completely settled!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedGroup.simplifiedDebts.map((debt) => {
                        const upiPayUrl = `upi://pay?pn=${encodeURIComponent(debt.toName)}&am=${debt.amount}&cu=INR&tn=${encodeURIComponent(`FinSight - ${selectedGroup.name}`)}`;
                        return (
                          <div
                            key={`${debt.from}-${debt.to}-${debt.amount}`}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-sm, 8px)',
                              background: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-color)',
                              flexWrap: 'wrap',
                              gap: '8px',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {debt.fromName} owes {debt.toName}
                              </div>
                              <div className="num-tabular" style={{ fontSize: '0.8rem', color: 'var(--color-negative)', fontWeight: 700 }}>
                                ₹{Number(debt.amount).toLocaleString('en-IN')}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              <a
                                href={upiPayUrl}
                                onClick={() => openSettlementModal(debt)}
                                title="Open UPI app (Google Pay, PhonePe, Paytm) to settle directly"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  background: 'linear-gradient(135deg, #10B981, #059669)',
                                  color: '#FFFFFF',
                                  borderRadius: 'var(--radius-sm, 8px)',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  boxShadow: 'var(--shadow-xs)',
                                }}
                              >
                                ⚡ Settle via UPI
                              </a>
                              <button
                                type="button"
                                onClick={() => openSettlementModal(debt)}
                                style={{
                                  padding: '5px 8px',
                                  background: 'transparent',
                                  border: '1px solid var(--border-strong)',
                                  color: 'var(--text-secondary)',
                                  borderRadius: 'var(--radius-sm, 8px)',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Record
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              <Card style={{ padding: '1.25rem 1.4rem' }}>
                <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Shared expenses</h3>
                {selectedGroup.expenses.length === 0 ? (
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                    No shared expenses yet.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr className="text-muted">
                          <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Date</th>
                          <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Description</th>
                          <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Paid by</th>
                          <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Split</th>
                          <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>My share</th>
                          <th style={{ textAlign: 'right', paddingBottom: '0.5rem' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...selectedGroup.expenses].reverse().map((expense) => (
                          <tr key={expense._id}>
                            <td style={{ padding: '0.55rem 0' }}>
                              {new Date(expense.date).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '0.55rem 0' }}>{expense.description}</td>
                            <td style={{ padding: '0.55rem 0' }}>{expense.paidByName}</td>
                            <td className="text-muted" style={{ padding: '0.55rem 0' }}>
                              {expense.splitBetweenNames.join(', ')}
                            </td>
                            <td style={{ padding: '0.55rem 0' }}>
                              {expense.syncPersonal && expense.personalShareAmount > 0 ? (
                                <span className="badge badge-positive">
                                  Synced {currency(expense.personalShareAmount)}
                                </span>
                              ) : (
                                <span className="text-muted">Not synced</span>
                              )}
                            </td>
                            <td style={{ padding: '0.55rem 0', textAlign: 'right' }}>
                              {currency(expense.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      <Modal title="Create split group" isOpen={groupModalOpen} onClose={() => setGroupModalOpen(false)}>
        <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>Group name</label>
            <input
              className="input-glass"
              value={groupForm.name}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Goa trip"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Members, one per line
            </label>
            <textarea
              className="input-glass"
              value={groupForm.members}
              onChange={(e) => setGroupForm((prev) => ({ ...prev, members: e.target.value }))}
              placeholder="Name or Name, email@example.com"
              rows={5}
              style={{ borderRadius: 18, resize: 'vertical' }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Create group'}
          </button>
        </form>
      </Modal>

      <Modal title="Add shared expense" isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)}>
        <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            className="input-glass"
            name="description"
            value={expenseForm.description}
            onChange={handleExpenseChange}
            placeholder="Description"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <input
              className="input-glass"
              type="number"
              name="amount"
              value={expenseForm.amount}
              onChange={handleExpenseChange}
              placeholder="Amount"
            />
            <input
              className="input-glass"
              type="date"
              name="date"
              value={expenseForm.date}
              onChange={handleExpenseChange}
            />
          </div>
          <input
            className="input-glass"
            name="category"
            value={expenseForm.category}
            onChange={handleExpenseChange}
            placeholder="Budget category, e.g. Food"
          />
          <select className="input-glass" name="paidBy" value={expenseForm.paidBy} onChange={handleExpenseChange}>
            {selectedGroup?.members.map((member) => (
              <option key={member._id} value={member._id}>
                Paid by {member.name}
              </option>
            ))}
          </select>
          <div>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              Split between
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {selectedGroup?.members.map((member) => (
                <label
                  key={member._id}
                  style={{
                    display: 'flex',
                    gap: '0.35rem',
                    alignItems: 'center',
                    padding: '0.45rem 0.7rem',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={expenseForm.splitBetween.includes(member._id)}
                    onChange={() => toggleSplitMember(member._id)}
                  />
                  {member.name}
                </label>
              ))}
            </div>
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.65rem 0.8rem',
              borderRadius: 18,
              background: 'rgba(0,212,170,0.08)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={expenseForm.syncPersonal}
              onChange={(e) =>
                setExpenseForm((prev) => ({ ...prev, syncPersonal: e.target.checked }))
              }
            />
            Add only my share to personal expenses and budgets
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Add expense'}
          </button>
        </form>
      </Modal>

      <Modal title="Record settlement" isOpen={settlementModalOpen} onClose={() => setSettlementModalOpen(false)}>
        <form onSubmit={handleAddSettlement} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <select
            className="input-glass"
            value={settlementForm.from}
            onChange={(e) => setSettlementForm((prev) => ({ ...prev, from: e.target.value }))}
          >
            {selectedGroup?.members.map((member) => (
              <option key={member._id} value={member._id}>
                From {member.name}
              </option>
            ))}
          </select>
          <select
            className="input-glass"
            value={settlementForm.to}
            onChange={(e) => setSettlementForm((prev) => ({ ...prev, to: e.target.value }))}
          >
            {selectedGroup?.members.map((member) => (
              <option key={member._id} value={member._id}>
                To {member.name}
              </option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <input
              className="input-glass"
              type="number"
              value={settlementForm.amount}
              onChange={(e) => setSettlementForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="Amount"
            />
            <input
              className="input-glass"
              type="date"
              value={settlementForm.date}
              onChange={(e) => setSettlementForm((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <input
            className="input-glass"
            value={settlementForm.note}
            onChange={(e) => setSettlementForm((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Note"
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Record settlement'}
          </button>
        </form>
      </Modal>
    </>
  );
};

export default SplitsPage;
