// TECH EXPERT 2K26 — NAVIGATION BAR
// Sri Venkateswara College of Engineering (SVCE)

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Trophy, 
  ShieldAlert, 
  LogOut, 
  LogIn, 
  UserPlus, 
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid var(--color-border)',
      boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px'
      }}>
        {/* Brand & Fest Identity */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.18)',
            border: '2px solid var(--color-primary)',
            backgroundColor: '#FFFFFF',
            flexShrink: 0
          }}>
            <img
              src="/logo.png"
              alt="Tech Expert Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                fontSize: '1.2rem',
                letterSpacing: '-0.02em',
                color: 'var(--color-text)'
              }}>
                TECH EXPERT <span style={{ color: 'var(--color-primary)' }}>2K26</span>
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                SVCE FEST
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', letterSpacing: '0.02em' }}>
              Sri Venkateswara College of Engineering
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }} className="desktop-nav">
          <Link 
            to="/leaderboard" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              color: isActive('/leaderboard') ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontSize: '0.9rem',
              fontWeight: isActive('/leaderboard') ? 600 : 500,
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isActive('/leaderboard') ? 'var(--color-primary-light)' : 'transparent',
              transition: 'all var(--transition-fast)'
            }}
          >
            <Trophy size={16} color={isActive('/leaderboard') ? 'var(--color-primary)' : 'var(--color-warning)'} />
            Leaderboard
          </Link>

          {user && !isAdmin && (
            <Link 
              to="/dashboard" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                color: isActive('/dashboard') ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontSize: '0.9rem',
                fontWeight: isActive('/dashboard') ? 600 : 500,
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isActive('/dashboard') ? 'var(--color-primary-light)' : 'transparent',
                transition: 'all var(--transition-fast)'
              }}
            >
              <LayoutDashboard size={16} color="var(--color-primary)" />
              Dashboard
            </Link>
          )}

          {isAdmin && (
            <Link 
              to="/admin/dashboard" 
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ShieldAlert size={15} />
              Admin Center
            </Link>
          )}

          {/* User Status / Actions */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {profile && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{profile.full_name}</span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                    Sec {profile.section} • Yr {profile.academic_year}
                  </span>
                </div>
              )}
              <button 
                onClick={handleSignOut}
                className="btn btn-secondary btn-sm"
                title="Sign out"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={15} />
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            color: 'var(--color-text)'
          }}
          className="mobile-menu-btn"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid var(--color-border)',
          padding: '1rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <Link
            to="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              color: 'var(--color-text)',
              fontWeight: 500
            }}
          >
            <Trophy size={18} color="var(--color-warning)" />
            Leaderboard
          </Link>

          {user && !isAdmin && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                color: 'var(--color-text)',
                fontWeight: 500
              }}
            >
              <LayoutDashboard size={18} color="var(--color-primary)" />
              Dashboard
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-primary btn-sm"
              style={{ justifyContent: 'center' }}
            >
              <ShieldAlert size={16} />
              Admin Control Center
            </Link>
          )}

          {user ? (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {profile && (
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Signed in as <strong>{profile.full_name}</strong> (Sec {profile.section}, Yr {profile.academic_year})
                </div>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                Register
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Media query helper styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
};
