// TECH EXPERT 2K26 — PHASE CONTROL & LIFECYCLE MANAGEMENT
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { PhaseControl, PhaseId, PhaseStatus, CompetitionSettings } from '../../types';
import {
  Sliders,
  Play,
  Pause,
  StopCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  AlertTriangle,
  RotateCcw,
  Zap,
  Code2,
  Trophy
} from 'lucide-react';

export const PhaseManagement: React.FC = () => {
  const [phases, setPhases] = useState<Record<PhaseId, PhaseControl> | null>(null);
  const [settings, setSettings] = useState<CompetitionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPhase, setSavingPhase] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        api.getPhaseControls(),
        api.getCompetitionSettings()
      ]);
      setPhases(p);
      setSettings(s);
    } catch (err) {
      console.error('Failed to load phase controls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (phase: PhaseId, newStatus: PhaseStatus) => {
    const reason = prompt(`Enter mandatory administrative reason for transitioning ${phase.toUpperCase()} to ${newStatus.toUpperCase()}:`, 'Event schedule transition');
    if (!reason) return;

    setSavingPhase(phase);
    try {
      await api.updatePhaseControl(phase, { status: newStatus }, reason);
      // If activating a phase, also update competition settings current_phase
      if (newStatus === 'active') {
        await api.updateCompetitionSettings({ current_phase: phase, event_status: 'active' }, reason);
      }
      await loadData();
    } catch (err: any) {
      alert(`Failed to update phase status: ${err.message}`);
    } finally {
      setSavingPhase(null);
    }
  };

  const handleUpdateConfig = async (phase: PhaseId, updates: Partial<PhaseControl>) => {
    setSavingPhase(phase);
    try {
      await api.updatePhaseControl(phase, updates, 'Updated phase configuration parameter');
      await loadData();
    } catch (err: any) {
      alert(`Failed to update config: ${err.message}`);
    } finally {
      setSavingPhase(null);
    }
  };

  if (loading || !phases) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto', border: '3px solid rgba(0, 242, 254, 0.2)', borderTopColor: 'var(--cyan-400)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Phase Lifecycle Matrix...</p>
      </div>
    );
  }

  const phaseList: PhaseId[] = ['phase1', 'phase2', 'phase3'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>
          Real-Time Governance
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Phase Lifecycle Management</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Start, pause, resume, and close competition phases. Configure timers, deadlines, and qualification quotas.
        </div>
      </div>

      {/* 3 Phase Control Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {phaseList.map((pId) => {
          const p = phases[pId];
          let icon = Zap;
          let color = 'var(--cyan-400)';
          let badgeClass = 'badge-cyan';

          if (pId === 'phase2') {
            icon = Code2;
            color = 'var(--purple-400)';
            badgeClass = 'badge-purple';
          } else if (pId === 'phase3') {
            icon = Trophy;
            color = 'var(--rose-400)';
            badgeClass = 'badge-rose';
          }

          const IconComponent = icon;

          return (
            <div key={pId} className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <IconComponent size={24} color={color} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${badgeClass}`}>{pId.toUpperCase()}</span>
                      <h2 style={{ fontSize: '1.4rem' }}>{p.title}</h2>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Current State:{' '}
                      <strong style={{
                        color: p.status === 'active' ? 'var(--emerald-400)' : p.status === 'paused' ? 'var(--amber-400)' : 'var(--text-muted)',
                        textTransform: 'uppercase'
                      }}>
                        {p.status}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* State Transition Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {p.status !== 'active' && (
                    <button
                      onClick={() => handleUpdateStatus(pId, 'active')}
                      disabled={savingPhase === pId}
                      className="btn btn-success btn-sm"
                    >
                      <Play size={14} fill="currentColor" /> Activate / Release
                    </button>
                  )}

                  {p.status === 'active' && (
                    <button
                      onClick={() => handleUpdateStatus(pId, 'paused')}
                      disabled={savingPhase === pId}
                      className="btn btn-secondary btn-sm"
                    >
                      <Pause size={14} fill="currentColor" /> Pause Phase
                    </button>
                  )}

                  {p.status !== 'closed' && (
                    <button
                      onClick={() => handleUpdateStatus(pId, 'closed')}
                      disabled={savingPhase === pId}
                      className="btn btn-danger btn-sm"
                    >
                      <StopCircle size={14} /> Close Phase
                    </button>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(pId, 'draft')}
                    disabled={savingPhase === pId}
                    className="btn btn-secondary btn-sm"
                    title="Reset back to Draft"
                  >
                    <RotateCcw size={14} /> Reset to Draft
                  </button>
                </div>
              </div>

              {/* Configuration Inputs */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.25)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem'
              }}>
                {/* Default Question Timer */}
                <div>
                  <label className="form-label">
                    <span>Default Question Timer</span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Seconds</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={p.default_question_timer}
                    onChange={(e) => handleUpdateConfig(pId, { default_question_timer: parseInt(e.target.value, 10) || 0 })}
                  />
                  <span className="form-hint">Used when question has no override</span>
                </div>

                {/* Total Phase Deadline */}
                <div>
                  <label className="form-label">
                    <span>Phase Total Deadline</span>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Minutes</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={p.total_deadline_minutes}
                    onChange={(e) => handleUpdateConfig(pId, { total_deadline_minutes: parseInt(e.target.value, 10) || 0 })}
                  />
                  <span className="form-hint">0 means no global time limit</span>
                </div>

                {/* Qualification Threshold */}
                <div>
                  <label className="form-label">
                    <span>Qualification Limit</span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Qualifiers</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={p.qualification_limit}
                    onChange={(e) => handleUpdateConfig(pId, { qualification_limit: parseInt(e.target.value, 10) || 1 })}
                  />
                  <span className="form-hint">Default: Top 15 (P1), Top 5 (P2)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
