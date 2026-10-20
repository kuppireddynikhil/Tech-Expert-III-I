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
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  GraduationCap,
  Building2,
  User,
  ExternalLink
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

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Participant Profile Banner */}
      <div className="glass-card-glow" style={{
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-cyan)'
          }}>
            <User size={32} color="#070B14" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.75rem' }}> Welcome to Tech Expert<br></br>{profile?.full_name}<br></br></h2>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {profile?.email} {profile?.college_id && `• ID: ${profile.college_id}`}
            </div>
          </div>
        </div>

        {/* Section & Academic Year Verified Database Fields */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{
            backgroundColor: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--cyan-400)', textTransform: 'uppercase', fontWeight: 700 }}>
              Assigned Section
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
              Section {profile?.section}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--purple-400)', textTransform: 'uppercase', fontWeight: 700 }}>
              Academic Year
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
              Year {profile?.academic_year}
            </div>
          </div>
        </div>
      </div>
      {/* Competition Phases Heading */}
      <div style={{ marginTop: '0.75rem', marginBottom: '-0.25rem' }}>
        <h2 style={{
          fontSize: '1.65rem',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          marginBottom: '0.35rem'
        }}>
          <Layers size={24} color="var(--cyan-400)" />
          Competition Phases
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', margin: 0 }}>
          Access your active competition challenges and track qualification status across each phase.
        </p>
      </div>

      {/* Competition Phase Cards (Each occupies a full row matching the banner width) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
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
                backgroundColor: 'rgba(0, 242, 254, 0.12)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Zap size={24} color="var(--cyan-400)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem', color: '#FFFFFF', fontWeight: 700 }}>
                  Phase 1: Quick Quiz
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
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
              color: 'var(--text-muted)',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '0.6rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Clock size={15} color="var(--cyan-400)" />
              <span>Timer: 15s / question • Passing: Top 15</span>
            </div>

            {phases?.phase1?.status === 'closed' ? (
              <Link
                to="/waiting-room/phase1"
                className="btn btn-secondary"
                style={{ minWidth: '220px', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              >
                <Lock size={15} color="var(--rose-400)" /> Phase 1 Closed (Locked)
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
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Code2 size={24} color="var(--purple-400)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem', color: '#FFFFFF', fontWeight: 700 }}>
                  Phase 2: Debugging Challenge
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
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
              color: 'var(--text-muted)',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '0.6rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Clock size={15} color="var(--purple-400)" />
              <span>Total Deadline: 15 Mins • Gemini AI Evaluated</span>
            </div>

            {phases?.phase2?.status === 'closed' ? (
              <Link
                to="/waiting-room/phase2"
                className="btn btn-secondary"
                style={{ minWidth: '220px', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              >
                <Lock size={15} color="var(--rose-400)" /> Phase 2 Closed (Locked)
              </Link>
            ) : phases?.phase2?.exam_started_at ? (
              <Link
                to="/phase2"
                className="btn btn-accent"
                style={{ minWidth: '220px' }}
              >
                Enter Debug Challenge <ArrowRight size={15} />
              </Link>
            ) : (phases?.phase2?.is_activated || phases?.phase2?.status === 'active') ? (
              <Link
                to="/waiting-room/phase2"
                className="btn btn-accent"
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
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Trophy size={24} color="var(--amber-400)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem', color: '#FFFFFF', fontWeight: 700 }}>
                  Phase 3: Logic Builder (Finals)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
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
              color: 'var(--rose-400)',
              backgroundColor: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              padding: '0.6rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={15} color="var(--rose-400)" />
              <span>Strict 3 Attempts Max • Permanent Lock on 3 Fails</span>
            </div>

            {phases?.phase3?.status === 'closed' ? (
              <Link
                to="/waiting-room/phase3"
                className="btn btn-secondary"
                style={{ minWidth: '220px', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              >
                <Lock size={15} color="var(--rose-400)" /> Phase 3 Closed (Locked)
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
