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
  ShieldCheck,
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: 'var(--color-background)'
      }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--color-primary-light)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%'
        }} />
        <div style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          Verifying administrative security credentials...
        </div>
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 45
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`admin-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}
        style={{
          width: '260px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Brand */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
            }}>
              <ShieldCheck size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>
                ADMIN CONSOLE
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600, letterSpacing: '0.04em' }}>
                TECH EXPERT 2K26
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="mobile-close-btn"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Links */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <div style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
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
                onClick={() => setMobileSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                  border: isActive ? '1px solid #BFDBFE' : '1px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  marginBottom: '0.25rem',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={17} color={isActive ? 'var(--color-primary)' : 'var(--color-disabled)'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <ChevronRight size={14} color="var(--color-primary)" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Area */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 600 }}>
                Active Admin Session
              </div>
            </div>
            <Link to="/" target="_blank" title="View Participant Site" style={{ color: 'var(--color-text-secondary)' }}>
              <ExternalLink size={16} />
            </Link>
          </div>
          <button
            onClick={() => signOut()}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Top Bar */}
        <div
          className="admin-mobile-topbar"
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Menu size={20} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Admin Menu</span>
          </button>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            TECH EXPERT 2K26
          </div>
        </div>

        {/* Top Notification Bar for Bootstrap Password Change Requirement */}
        {mustChangePassword && (
          <div style={{
            backgroundColor: '#FFFBEB',
            borderBottom: '1px solid #FDE68A',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <KeyRound size={18} color="var(--color-warning)" />
              <span style={{ fontSize: '0.875rem', color: '#92400E' }}>
                <strong>Security Alert:</strong> You are using initial bootstrap administrator credentials. Please change your password now to secure the event.
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
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: mustChangePassword ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-modal)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <KeyRound size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text)', margin: 0 }}>Change Initial Password</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
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

      {/* Responsive Styles for Sidebar */}
      <style>{`
        @media (max-width: 900px) {
          .admin-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: -280px !important;
            transition: left 0.25s ease !important;
          }
          .admin-sidebar.mobile-open {
            left: 0 !important;
          }
          .mobile-close-btn {
            display: block !important;
          }
          .admin-mobile-topbar {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
