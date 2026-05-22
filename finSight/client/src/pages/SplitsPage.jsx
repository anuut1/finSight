import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import Modal from '../components/Modal.jsx';
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
            Loading split groups...
          </p>
        </GlassCard>
      ) : groups.length === 0 ? (
        <GlassCard style={{ padding: '1.2rem 1.4rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>No groups yet</h2>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Create a group for a trip, room, dinner, or project to start splitting costs.
          </p>
          <button type="button" className="btn-primary" onClick={() => setGroupModalOpen(true)}>
            Create your first group
          </button>
        </GlassCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: '1rem' }}>
          <GlassCard style={{ padding: '0.9rem' }}>
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
                    borderRadius: 14,
                    border:
                      selectedGroup?._id === group._id
                        ? '1px solid rgba(79,142,247,0.65)'
                        : '1px solid var(--glass-border)',
                    background:
                      selectedGroup?._id === group._id
                        ? 'rgba(79,142,247,0.18)'
                        : 'rgba(255,255,255,0.03)',
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
          </GlassCard>

          {selectedGroup && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <GlassCard style={{ padding: '1rem 1.2rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedGroup.name}</h2>
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                      Your synced split share is counted in Transactions, Budgets, and Analytics.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" className="btn-primary" onClick={openExpenseModal}>
                      + Expense
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => openSettlementModal()}
                    >
                      Settle
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteGroup}
                      style={{
                        border: '1px solid rgba(255,107,107,0.45)',
                        background: 'rgba(255,107,107,0.08)',
                        color: 'var(--accent-red)',
                        borderRadius: 999,
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </GlassCard>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
                <GlassCard style={{ padding: '1rem 1.2rem' }}>
                  <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Balances</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {selectedGroup.memberBalances.map((member) => (
                      <div
                        key={member.memberId}
                        style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}
                      >
                        <span>{member.name}</span>
                        <strong
                          style={{
                            color:
                              member.balance > 0
                                ? 'var(--accent-teal)'
                                : member.balance < 0
                                ? 'var(--accent-red)'
                                : 'var(--text-muted)',
                          }}
                        >
                          {currency(member.balance)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard style={{ padding: '1rem 1.2rem' }}>
                  <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Who owes whom</h3>
                  {selectedGroup.simplifiedDebts.length === 0 ? (
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                      Everyone is settled.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {selectedGroup.simplifiedDebts.map((debt) => (
                        <div
                          key={`${debt.from}-${debt.to}-${debt.amount}`}
                          style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}
                        >
                          <span>
                            {debt.fromName} owes {debt.toName}
                          </span>
                          <button
                            type="button"
                            onClick={() => openSettlementModal(debt)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--accent-blue)',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            {currency(debt.amount)}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </div>

              <GlassCard style={{ padding: '1rem 1.2rem' }}>
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
              </GlassCard>
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
