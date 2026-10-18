// TECH EXPERT 2K26 — PARTICIPANT LOGIN
// Sri Venkateswara College of Engineering (SVCE)

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LogIn, Terminal, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide your registered email and password.');
      return;
    }

    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        // Preview mock login
        navigate('/dashboard');
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError) throw authError;

      // Check if user is actually an admin trying to login via participant portal
      const { data: roleData } = await supabase
        .from('admin_roles')
        .select('role, status')
        .eq('user_id', data.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (roleData) {
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        navigate(from, { replace: true });
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow">
      <div className="glass-card" style={{ padding: '2.5rem', maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--grad-cyan)',
            margin: '0 auto 1rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-cyan)'
          }}>
            <LogIn size={24} color="#070B14" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Participant Sign In</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Tech Expert 2K26 — SVCE Competition Portal
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Registered Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. participant@svce.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Event'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>
            Register Now
          </Link>
        </div>

        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
          fontSize: '0.8rem'
        }}>
          <Link to="/admin/login" style={{ color: 'var(--purple-400)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldAlert size={14} /> Event Administrator Login
          </Link>
        </div>
      </div>
    </div>
  );
};
