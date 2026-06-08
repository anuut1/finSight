import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import '../styles/login.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

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
        if (rememberMe) {
          localStorage.setItem('rememberEmail', form.email);
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Side - Brand & Features */}
      <div className="login-left">
        <div>
          <h1>FinSight</h1>
          <p>Master your finances with intelligent expense tracking and insights.</p>
          
          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">💰</div>
              <div className="login-feature-text">
                <h3>Track Expenses</h3>
                <p>Categorize and organize all your spending</p>
              </div>
            </div>
            
            <div className="login-feature">
              <div className="login-feature-icon">📊</div>
              <div className="login-feature-text">
                <h3>Smart Analytics</h3>
                <p>Get detailed insights into your spending patterns</p>
              </div>
            </div>
            
            <div className="login-feature">
              <div className="login-feature-icon">👥</div>
              <div className="login-feature-text">
                <h3>Split Bills</h3>
                <p>Easily manage shared expenses with friends</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header">
            <div className="login-logo">FS</div>
            <h2>Welcome Back</h2>
            <p>Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}

            {/* Social Login */}
            <div className="social-login">
              <button type="button" className="social-btn" disabled={loading}>
                <span className="social-btn-icon">G</span>
                Google
              </button>
              <button type="button" className="social-btn" disabled={loading}>
                <span className="social-btn-icon">f</span>
                Facebook
              </button>
            </div>

            <div className="login-divider">
              <span>or continue with email</span>
            </div>

            {/* Email Field */}
            <div className="form-group-login">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="form-group-login">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="login-footer">
            Don't have an account?{' '}
            <Link to="/register">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
