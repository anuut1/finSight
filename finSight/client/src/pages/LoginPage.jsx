import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      if (res.data?.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign in');
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
          width: 'min(420px, 100%)',
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
            Welcome back
          </div>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Sign in to FinSight</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            Visualise your income, expenses, and goals in one glass panel.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
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
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="input-glass"
              placeholder="Enter your password"
            />
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p
          className="text-muted"
          style={{ marginTop: '1rem', fontSize: '0.8rem', textAlign: 'center' }}
        >
          New to FinSight?{' '}
          <Link to="/register" style={{ color: 'var(--accent-blue)' }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

