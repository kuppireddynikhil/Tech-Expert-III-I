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
              <h2 style={{ fontSize: '1.75rem' }}>{profile?.full_name}</h2>
              <span className="badge badge-emerald">
                {profile?.registration_status?.toUpperCase()}
              </span>
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

      {/* Competition Status Alert */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={20} color="var(--cyan-400)" />
          <div>
            <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.95rem' }}>
              Competition Event State: <span style={{ color: 'var(--cyan-400)', textTransform: 'uppercase' }}>{settings?.event_status}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Current Active Stage: <strong>{settings?.current_phase}</strong> • College: Sri Venkateswara College of Engineering
            </div>
          </div>
        </div>

        {assignedSetP1 && (
          <div className="badge badge-cyan" style={{ padding: '0.4rem 0.85rem' }}>
            <Layers size={14} /> Assigned: {assignedSetP1.set_name}
          </div>
        )}
      </div>

      {/* 3 Competition Phase Cards */}
      <div className="grid-3">
        {/* Phase 1 Card */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(0, 242, 254, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={22} color="var(--cyan-400)" />
            </div>
            <span className={`badge ${phases?.phase1?.status === 'active' ? 'badge-emerald' : 'badge-cyan'}`}>
              {phases?.phase1?.status?.toUpperCase()}
            </span>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Phase 1: Quick Quiz</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              20 Python fundamental MCQs with strict 15s per-question timer. Top 15 qualify for Phase 2.
            </p>
          </div>

          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)'
          }}>
            Timer: 15s / question • Passing: Top 15
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <Link
              to="/phase1"
              className={`btn ${phases?.phase1?.status === 'active' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%' }}
            >
              {phases?.phase1?.status === 'active' ? 'Start Quick Quiz' : 'View Quick Quiz'}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Phase 2 Card */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Code2 size={22} color="var(--purple-400)" />
            </div>
            <span className={`badge ${phases?.phase2?.status === 'active' ? 'badge-emerald' : 'badge-purple'}`}>
              {phases?.phase2?.status?.toUpperCase()}
            </span>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Phase 2: Debugging Challenge</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              3 Debugging programs inside Monaco Editor with 15 minutes overall phase limit. Top 5 qualify.
            </p>
          </div>

          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)'
          }}>
            Total Deadline: 15 Mins • Gemini AI Evaluated
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <Link
              to="/phase2"
              className={`btn ${phases?.phase2?.status === 'active' ? 'btn-accent' : 'btn-secondary'}`}
              style={{ width: '100%' }}
            >
              {phases?.phase2?.status === 'active' ? 'Enter Debug Challenge' : 'View Debug Challenge'}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Phase 3 Card */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trophy size={22} color="var(--amber-400)" />
            </div>
            <span className={`badge ${phases?.phase3?.status === 'active' ? 'badge-emerald' : 'badge-rose'}`}>
              {phases?.phase3?.status?.toUpperCase()}
            </span>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Phase 3: Logic Builder (Finals)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              3 complex algorithmic challenges. Choose order freely. Exactly 3 Run attempts per program before permanent lock!
            </p>
          </div>

          <div style={{
            fontSize: '0.8rem',
            color: 'var(--rose-400)',
            backgroundColor: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)'
          }}>
            Strict 3 Attempts Max • Permanent Lock on 3 Fails
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <Link
              to="/phase3"
              className={`btn ${phases?.phase3?.status === 'active' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%' }}
            >
              {phases?.phase3?.status === 'active' ? 'Enter Logic Builder' : 'View Logic Builder'}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
