// TECH EXPERT 2K26 — ADMIN DASHBOARD LAYOUT
// Sri Venkateswara College of Engineering (SVCE)

import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Database,
  Layers,
  Sliders,
  Clock,
  Users,
  CheckSquare,
  Trophy,
  ArrowUpCircle,
  History,
  Settings,
  LogOut,
  ChevronRight,
  ShieldAlert,
  KeyRound,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, mustChangePassword, updatePassword, signOut, loading } = useAuth();
  const location = useLocation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: 'var(--bg-dark)'
      }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(168, 85, 247, 0.2)',
          borderTopColor: 'var(--purple-400)',
          borderRadius: '50%'
        }} />
        <div style={{ color: 'var(--text-muted)' }}>Verifying administrative security credentials...</div>
      </div>
    );
  }

  // Enforce server-side verified admin authorization
  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    const result = await updatePassword(newPassword);
    setUpdatingPassword(false);

    if (result.success) {
      setPasswordSuccess('Password successfully updated! Bootstrap credential has been invalidated.');
    } else {
      setPasswordError(result.error || 'Failed to update password');
    }
  };

  const navLinks = [
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/questions', label: 'Question Bank', icon: Database },
    { to: '/admin/question-sets', label: 'Question Sets', icon: Layers },
    { to: '/admin/phases', label: 'Phase Control', icon: Sliders },
    { to: '/admin/timers', label: 'Timers Config', icon: Clock },
    { to: '/admin/participants', label: 'Participants', icon: Users },
    { to: '/admin/advancement', label: 'Phase Advancement', icon: ArrowUpCircle },
    { to: '/admin/evaluations', label: 'Evaluation Reviews', icon: CheckSquare },
    { to: '/admin/leaderboard', label: 'Leaderboard & Winners', icon: Trophy },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: History },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        backgroundColor: 'rgba(10, 15, 29, 0.95)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 40
      }}>
        {/* Brand */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--grad-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-purple)'
          }}>
            <ShieldAlert size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF' }}>
              ADMIN CONSOLE
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--purple-400)', letterSpacing: '0.04em' }}>
              TECH EXPERT 2K26
            </div>
          </div>
        </div>

        {/* Links */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '0.5rem 0.75rem'
          }}>
            Competition Control
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');

            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--cyan-400)' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 242, 254, 0.25)' : '1px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  marginBottom: '0.25rem',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={17} color={isActive ? 'var(--cyan-400)' : 'var(--text-dim)'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Area */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--emerald-400)' }}>
                Active Admin Session
              </div>
            </div>
            <Link to="/" target="_blank" title="View Participant Site" style={{ color: 'var(--text-muted)' }}>
              <ExternalLink size={16} />
            </Link>
          </div>
          <button
            onClick={() => signOut()}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Notification Bar for Bootstrap Password Change Requirement */}
        {mustChangePassword && (
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            borderBottom: '1px solid var(--amber-400)',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <KeyRound size={18} color="var(--amber-400)" />
              <span style={{ fontSize: '0.875rem', color: '#FFFFFF' }}>
                <strong>Security Alert:</strong> You are using the initial bootstrap administrator credentials. Please change your password now to secure the event.
              </span>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('security-modal');
                if (el) el.style.display = 'flex';
              }}
              className="btn btn-primary btn-sm"
            >
              Update Password
            </button>
          </div>
        )}

        <main style={{ flex: 1, padding: '2rem' }}>
          <Outlet />
        </main>
      </div>

      {/* Bootstrap Password Change Modal */}
      {mustChangePassword && (
        <div
          id="security-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: mustChangePassword ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div className="glass-card-glow" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 242, 254, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <KeyRound size={20} color="var(--cyan-400)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Change Initial Password</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Mandatory bootstrap requirement for Tech Expert 2K26
                </div>
              </div>
            </div>

            {passwordError && <div className="alert alert-danger">{passwordError}</div>}
            {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}

            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">New Administrator Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {updatingPassword ? 'Saving Password...' : 'Save New Password & Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
