import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (res.data?.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: 'min(460px, 100%)',
          padding: '1.75rem 1.8rem',
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
              marginBottom: '0.3rem',
            }}
          >
            Get started
          </div>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Create your FinSight account</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            Track cash flow, budgets, and long‑term goals with a clean, glass dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-glass"
              placeholder="Your name"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="input-glass"
              placeholder="you@example.com"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="input-glass"
                placeholder="Create a password"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                Confirm password
              </label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="input-glass"
                placeholder="Repeat password"
              />
            </div>
          </div>
          {error && (
            <div
              style={{
                background: 'rgba(255, 107, 107, 0.1)',
                borderRadius: 999,
                padding: '0.5rem 0.9rem',
                fontSize: '0.8rem',
                color: 'var(--accent-red)',
              }}
            >
              {error}
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p
          className="text-muted"
          style={{ marginTop: '1rem', fontSize: '0.8rem', textAlign: 'center' }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-blue)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

