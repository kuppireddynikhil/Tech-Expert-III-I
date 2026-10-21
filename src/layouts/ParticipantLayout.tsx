// Participant Layout (Protected route wrapper)
import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const ParticipantLayout: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--color-primary-light)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%'
        }} />
        <div style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Verifying participant session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile?.registration_status === 'suspended' || profile?.registration_status === 'disqualified') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-background)' }}>
        <Navbar />
        <main style={{ flex: 1, padding: '3rem 0' }}>
          <div className="container-narrow">
            <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                margin: '0 auto 1.5rem auto',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={32} color="var(--color-danger)" />
              </div>
              <h2 style={{ marginBottom: '1rem', color: 'var(--color-danger)' }}>Account Access Restricted</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Your participant account is currently flagged as <strong>{profile.registration_status}</strong> by the event administrator.
                Please contact the SVCE Tech Expert organizing committee for assistance.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '2rem 0' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
