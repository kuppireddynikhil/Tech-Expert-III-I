// TECH EXPERT 2K26 — SECURE ADMIN LOGIN
// Sri Venkateswara College of Engineering (SVCE)

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ShieldAlert, Lock, Mail, AlertTriangle, ArrowRight, KeyRound } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('svce.techexpert.2K26@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rawFrom = (location.state as any)?.from?.pathname;
  const from = (rawFrom && rawFrom !== '/admin/login' && rawFrom !== '/login') ? rawFrom : '/admin/dashboard';

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide administrative email and password.');
      return;
    }

    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        // Preview mode
        navigate('/admin/dashboard');
        return;
      }

      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError) throw authError;

      // 2. Strict Server Role Verification in admin_roles
      const { data: roleRecord, error: roleError } = await supabase
        .from('admin_roles')
        .select('role, status, must_change_password')
        .eq('user_id', authData.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (roleError || !roleRecord) {
        // User authenticated but has NO server-side admin role!
        await supabase.auth.signOut();
        throw new Error('Access Denied: This account does not possess trusted administrator privileges.');
      }

      // Success: Redirect to admin control center
      navigate(from, { replace: true });

    } catch (err: any) {
      console.error('Admin login verification failed:', err);
      setError(err.message || 'Administrative authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-card-glow" style={{ padding: '2.5rem', maxWidth: '480px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--grad-purple)',
            margin: '0 auto 1.25rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-purple)'
          }}>
            <ShieldAlert size={28} color="#FFFFFF" />
          </div>
          <h2 style={{ fontSize: '1.85rem', marginBottom: '0.4rem' }}>Administrator Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            SVCE Tech Expert 2K26 — Central Governance
          </p>
        </div>

        {/* Expected Email Hint as permitted by Section 4 */}
        <div style={{
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.8rem',
          color: 'var(--purple-400)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <KeyRound size={16} />
          <span>
            Designated Admin: <strong>svce.techexpert.2K26@gmail.com</strong>
          </span>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin}>
          <div className="form-group">
            <label className="form-label">Admin Username / Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Admin Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter administrator password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-accent btn-lg"
            style={{ width: '100%', marginTop: '1.25rem' }}
          >
            {loading ? 'Verifying Admin Credentials...' : 'Authenticate to Admin Center'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.8rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>
            &larr; Return to Participant Portal
          </Link>
        </div>
      </div>
    </div>
  );
};
