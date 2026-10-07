import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import Input from '../components/Input';
import Button from '../components/Button';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/login.css';

/**
 * Quiet Ledger Register Page (/register)
 *
 * - Same layout as Login: single centered column, max-width 380px, plain ground
 * - Wordmark "FinSight" in serif top-left
 * - Headline "Start calm." (serif, ~52px), one line beneath: "Create your account. It takes a minute."
 * - Fields: Name, Email, Password (hint "At least 8 characters", show/hide toggle with aria-label)
 * - Buttons: primary "Create account" (pill), secondary "Continue with Google" (outline pill, text only)
 * - Footer: "Already have an account? Log in"
 * - Inline validation in warning color, no popups
 */
const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      if (res.data?.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-topbar">
        <Link to="/" className="auth-wordmark" aria-label="FinSight Home">
          FinSight
        </Link>
        <ThemeToggle />
      </header>

      <main className="auth-container">
        <h1 className="auth-headline">Start calm.</h1>
        <p className="auth-subhead">Create your account. It takes a minute.</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <Input
            label="Name"
            id="register-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Alex Sharma"
            autoComplete="name"
            required
            disabled={loading}
          />

          <Input
            label="Email"
            id="register-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={loading}
          />

          <Input
            label="Password"
            id="register-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="new-password"
            hint="At least 8 characters"
            required
            disabled={loading}
            rightAction={
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            }
          />

          {error && (
            <div role="alert" className="auth-inline-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="auth-actions">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Create account
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              disabled={loading}
              onClick={() => {
                // Future Google OAuth integration hook (marked TODO)
                setError('Google sign-up is not yet configured.');
              }}
            >
              Continue with Google
            </Button>
          </div>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
};

export default RegisterPage;
