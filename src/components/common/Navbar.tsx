// TECH EXPERT 2K26 — NAVIGATION BAR
// Sri Venkateswara College of Engineering (SVCE)

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Trophy, 
  ShieldAlert, 
  LogOut, 
  LogIn, 
  UserPlus, 
  LayoutDashboard,
  Code2,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(7, 11, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px'
      }}>
        {/* Brand & Fest Identity */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-cyan)',
            border: '2px solid rgba(0, 242, 254, 0.6)',
            backgroundColor: '#070B14',
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
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                color: '#FFFFFF'
              }}>
                TECH EXPERT <span style={{ color: 'var(--cyan-400)' }}>2K26</span>
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                SVCE FEST
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Sri Venkateswara College of Engineering
            </div>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link 
            to="/leaderboard" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          >
            <Trophy size={16} color="var(--amber-400)" />
            Leaderboard
          </Link>

          {user && !isAdmin && (
            <Link 
              to="/dashboard" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            >
              <LayoutDashboard size={16} color="var(--cyan-400)" />
              Dashboard
            </Link>
          )}

          {isAdmin && (
            <Link 
              to="/admin/dashboard" 
              className="btn btn-accent btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ShieldAlert size={15} />
              Admin Control Center
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
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem'
                }}>
                  <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{profile.full_name}</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
      </div>
    </header>
  );
};
