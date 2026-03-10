import { useState } from 'react';

const TransactionForm = ({ initialValues, onSubmit, submitting }) => {
  const [form, setForm] = useState(
    initialValues || {
      type: 'expense',
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      mood: 'neutral',
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      amount: Number(form.amount),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="input-glass"
          style={{ flex: 1 }}
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          className="input-glass"
          placeholder="Category"
          style={{ flex: 1 }}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          className="input-glass"
          placeholder="Amount"
          style={{ flex: 1 }}
        />
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="input-glass"
          style={{ flex: 1 }}
        />
      </div>
      <input
        name="description"
        value={form.description}
        onChange={handleChange}
        className="input-glass"
        placeholder="Description"
      />
      <select
        name="mood"
        value={form.mood}
        onChange={handleChange}
        className="input-glass"
      >
        <option value="happy">Good</option>
        <option value="neutral">Neutral</option>
        <option value="stressed">Stressed</option>
      </select>
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save transaction'}
      </button>
    </form>
  );
};

export default TransactionForm;

