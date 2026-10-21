// TECH EXPERT 2K26 — PARTICIPANT DASHBOARD
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { CompetitionSettings, PhaseControl } from '../types';
import {
  Zap,
  Code2,
  Trophy,
  ArrowRight,
  Clock,
  AlertTriangle,
  Lock,
  Layers,
  User
} from 'lucide-react';

export const ParticipantDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<CompetitionSettings | null>(null);
  const [phases, setPhases] = useState<Record<string, PhaseControl> | null>(null);
  const [assignedSetP1, setAssignedSetP1] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadParticipantOverview() {
      try {
        const [s, p] = await Promise.all([
          api.getCompetitionSettings(),
          api.getPhaseControls()
        ]);
        setSettings(s);
        setPhases(p);

        // Fetch assigned set for Phase 1
        try {
          const p1Set = await api.getParticipantAssignedSet('phase1');
          setAssignedSetP1(p1Set);
        } catch (e) {
          console.log('No assigned set for Phase 1 currently');
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadParticipantOverview();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          margin: '0 auto 1rem auto',
          border: '3px solid var(--color-primary-light)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%'
        }} />
        <p style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Loading participant dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Participant Profile Banner */}
      <div className="glass-card" style={{
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={30} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--color-text)', margin: 0, fontWeight: 800 }}>
                Welcome, {profile?.full_name}
              </h2>
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
              {profile?.email} {profile?.college_id && `• ID: ${profile.college_id}`}
            </div>
          </div>
        </div>

        {/* Section & Academic Year Verified Database Fields */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid #BFDBFE',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
              Assigned Section
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)' }}>
              Section {profile?.section}
            </div>
          </div>

          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #DBEAFE',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#1D4ED8', textTransform: 'uppercase', fontWeight: 700 }}>
              Academic Year
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)' }}>
              Year {profile?.academic_year}
            </div>
          </div>
        </div>
      </div>

      {/* Competition Phases Heading */}
      <div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'var(--color-text)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          marginBottom: '0.35rem'
        }}>
          <Layers size={22} color="var(--color-primary)" />
          Competition Phases
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Access your active competition challenges and track qualification status across each phase.
        </p>
      </div>

      {/* Competition Phase Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
        {/* Phase 1 Card */}
        <div className="glass-card" style={{
          padding: '1.75rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1.25rem',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '280px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Zap size={24} color="var(--color-primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--color-text)', fontWeight: 700 }}>
                  Phase 1: Quick Quiz
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
                  20 Python fundamental MCQs with strict 15s per-question timer. Top 15 qualify for Phase 2.
                </p>
              </div>
            </div>

            {phases?.phase1?.status === 'closed' ? (
              <span className="badge badge-rose" style={{ alignSelf: 'flex-start' }}>CLOSED & LOCKED</span>
            ) : phases?.phase1?.exam_started_at ? (
              <span className="badge badge-emerald" style={{ alignSelf: 'flex-start' }}>EXAM LIVE</span>
            ) : (phases?.phase1?.is_activated || phases?.phase1?.status === 'active') ? (
              <span className="badge badge-amber" style={{ alignSelf: 'flex-start' }}>WAITING ROOM OPEN</span>
            ) : (
              <span className="badge badge-cyan" style={{ alignSelf: 'flex-start' }}>{phases?.phase1?.status?.toUpperCase() || 'LOCKED'}</span>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              fontSize: '0.825rem',
              color: 'var(--color-text-secondary)',
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-subtle)',
              padding: '0.55rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Clock size={15} color="var(--color-primary)" />
              <span>Timer: 15s / question • Passing: Top 15</span>
            </div>

            {phases?.phase1?.status === 'closed' ? (
              <Link
                to="/waiting-room/phase1"
                className="btn btn-secondary"
                style={{ minWidth: '220px' }}
              >
                <Lock size={15} color="var(--color-danger)" /> Phase 1 Closed (Locked)
              </Link>
            ) : phases?.phase1?.exam_started_at ? (
              <Link
                to="/phase1"
                className="btn btn-primary"
                style={{ minWidth: '220px' }}
              >
                Start Quick Quiz <ArrowRight size={15} />
              </Link>
            ) : (phases?.phase1?.is_activated || phases?.phase1?.status === 'active') ? (
              <Link
                to="/waiting-room/phase1"
                className="btn btn-primary"
                style={{ minWidth: '220px' }}
              >
                Enter Waiting Room <ArrowRight size={15} />
              </Link>
            ) : (
              <Link
                to="/waiting-room/phase1"
                className="btn btn-secondary"
                style={{ minWidth: '220px' }}
              >
                <Lock size={15} /> Phase 1 Locked
              </Link>
            )}
          </div>
        </div>

        {/* Phase 2 Card */}
        <div className="glass-card" style={{
          padding: '1.75rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1.25rem',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '280px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Code2 size={24} color="var(--color-primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--color-text)', fontWeight: 700 }}>
                  Phase 2: Debugging Challenge
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
                  3 Debugging programs inside Monaco Editor with 15 minutes overall phase limit. Top 5 qualify.
                </p>
              </div>
            </div>

            {phases?.phase2?.status === 'closed' ? (
              <span className="badge badge-rose" style={{ alignSelf: 'flex-start' }}>CLOSED & LOCKED</span>
            ) : phases?.phase2?.exam_started_at ? (
              <span className="badge badge-emerald" style={{ alignSelf: 'flex-start' }}>EXAM LIVE</span>
            ) : (phases?.phase2?.is_activated || phases?.phase2?.status === 'active') ? (
              <span className="badge badge-amber" style={{ alignSelf: 'flex-start' }}>WAITING ROOM OPEN</span>
            ) : (
              <span className="badge badge-purple" style={{ alignSelf: 'flex-start' }}>{phases?.phase2?.status?.toUpperCase() || 'LOCKED'}</span>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              fontSize: '0.825rem',
              color: 'var(--color-text-secondary)',
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-subtle)',
              padding: '0.55rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Clock size={15} color="var(--color-primary)" />
              <span>Total Deadline: 15 Mins • Gemini AI Evaluated</span>
            </div>

            {phases?.phase2?.status === 'closed' ? (
              <Link
                to="/waiting-room/phase2"
                className="btn btn-secondary"
                style={{ minWidth: '220px' }}
              >
                <Lock size={15} color="var(--color-danger)" /> Phase 2 Closed (Locked)
              </Link>
            ) : phases?.phase2?.exam_started_at ? (
              <Link
                to="/phase2"
                className="btn btn-primary"
                style={{ minWidth: '220px' }}
              >
                Enter Debug Challenge <ArrowRight size={15} />
              </Link>
            ) : (phases?.phase2?.is_activated || phases?.phase2?.status === 'active') ? (
              <Link
                to="/waiting-room/phase2"
                className="btn btn-primary"
                style={{ minWidth: '220px' }}
              >
                Enter Waiting Room <ArrowRight size={15} />
              </Link>
            ) : (
              <Link
                to="/waiting-room/phase2"
                className="btn btn-secondary"
                style={{ minWidth: '220px' }}
              >
                <Lock size={15} /> Phase 2 Locked
              </Link>
            )}
          </div>
        </div>

        {/* Phase 3 Card */}
        <div className="glass-card" style={{
          padding: '1.75rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1.25rem',
          width: '100%'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '280px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Trophy size={24} color="var(--color-warning)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--color-text)', fontWeight: 700 }}>
                  Phase 3: Logic Builder (Finals)
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
                  3 complex algorithmic challenges. Choose order freely. Exactly 3 Run attempts per program before permanent lock!
                </p>
              </div>
            </div>

            {phases?.phase3?.status === 'closed' ? (
              <span className="badge badge-rose" style={{ alignSelf: 'flex-start' }}>CLOSED & LOCKED</span>
            ) : phases?.phase3?.exam_started_at ? (
              <span className="badge badge-emerald" style={{ alignSelf: 'flex-start' }}>EXAM LIVE</span>
            ) : (phases?.phase3?.is_activated || phases?.phase3?.status === 'active') ? (
              <span className="badge badge-amber" style={{ alignSelf: 'flex-start' }}>WAITING ROOM OPEN</span>
            ) : (
              <span className="badge badge-rose" style={{ alignSelf: 'flex-start' }}>{phases?.phase3?.status?.toUpperCase() || 'LOCKED'}</span>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              fontSize: '0.825rem',
              color: 'var(--color-danger)',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              padding: '0.55rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 500
            }}>
              <AlertTriangle size={15} color="var(--color-danger)" />
              <span>Strict 3 Attempts Max • Permanent Lock on 3 Fails</span>
            </div>

            {phases?.phase3?.status === 'closed' ? (
              <Link
                to="/waiting-room/phase3"
                className="btn btn-secondary"
                style={{ minWidth: '220px' }}
              >
                <Lock size={15} color="var(--color-danger)" /> Phase 3 Closed (Locked)
              </Link>
            ) : phases?.phase3?.exam_started_at ? (
              <Link
                to="/phase3"
                className="btn btn-primary"
                style={{ minWidth: '220px' }}
              >
                Enter Logic Builder <ArrowRight size={15} />
              </Link>
            ) : (phases?.phase3?.is_activated || phases?.phase3?.status === 'active') ? (
              <Link
                to="/waiting-room/phase3"
                className="btn btn-primary"
                style={{ minWidth: '220px' }}
              >
                Enter Waiting Room <ArrowRight size={15} />
              </Link>
            ) : (
              <Link
                to="/waiting-room/phase3"
                className="btn btn-secondary"
                style={{ minWidth: '220px' }}
              >
                <Lock size={15} /> Phase 3 Locked
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
