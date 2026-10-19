// TECH EXPERT 2K26 — PHASE CONTROL & LIFECYCLE MANAGEMENT
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CountdownTimer } from '../../components/common/CountdownTimer';
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
  Trophy,
  Lock
} from 'lucide-react';

export const PhaseManagement: React.FC = () => {
  const [phases, setPhases] = useState<Record<PhaseId, PhaseControl> | null>(null);
  const [settings, setSettings] = useState<CompetitionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPhase, setSavingPhase] = useState<string | null>(null);
  const [localConfig, setLocalConfig] = useState<Record<PhaseId, {
    default_question_timer: number;
    total_deadline_minutes: number;
    qualification_limit: number;
  }>>({
    phase1: { default_question_timer: 15, total_deadline_minutes: 0, qualification_limit: 15 },
    phase2: { default_question_timer: 0, total_deadline_minutes: 15, qualification_limit: 5 },
    phase3: { default_question_timer: 0, total_deadline_minutes: 0, qualification_limit: 2 }
  });

  const loadData = async () => {
    try {
      const [p, s] = await Promise.all([
        api.getPhaseControls(),
        api.getCompetitionSettings()
      ]);
      setPhases(p);
      setSettings(s);
      setLocalConfig({
        phase1: {
          default_question_timer: p.phase1?.default_question_timer ?? 15,
          total_deadline_minutes: p.phase1?.total_deadline_minutes ?? 0,
          qualification_limit: p.phase1?.qualification_limit ?? 15
        },
        phase2: {
          default_question_timer: p.phase2?.default_question_timer ?? 0,
          total_deadline_minutes: p.phase2?.total_deadline_minutes ?? 15,
          qualification_limit: p.phase2?.qualification_limit ?? 5
        },
        phase3: {
          default_question_timer: p.phase3?.default_question_timer ?? 0,
          total_deadline_minutes: p.phase3?.total_deadline_minutes ?? 0,
          qualification_limit: p.phase3?.qualification_limit ?? 2
        }
      });
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

  const handleEndPhase = async (phase: PhaseId) => {
    const confirmed = confirm(
      `⚠️ CRITICAL ACTION: END ${phase.toUpperCase()} FOR ALL PARTICIPANTS\n\n` +
      `This will immediately:\n` +
      `1. Mark ${phase.toUpperCase()} as CLOSED.\n` +
      `2. Forcibly submit and finalize all in-progress participant answers.\n` +
      `3. Permanently lock participants' screens and block any re-entry.\n` +
      `4. Stop and reset phase countdown timers to 00:00.\n\n` +
      `Are you sure you want to proceed?`
    );
    if (!confirmed) return;

    const reason = prompt(
      `Enter administrative reason for ending ${phase.toUpperCase()} for all participants:`,
      'Scheduled phase closure and finalization by administrator'
    );
    if (!reason) return;

    setSavingPhase(phase);
    try {
      const result = await api.endPhaseForEveryone(phase, reason);
      alert(
        `✅ ${phase.toUpperCase()} has been ended successfully.\n\n` +
        `• Status: CLOSED\n` +
        `• Active participant sessions finalized & locked: ${result.affectedSessions}\n` +
        `• Participant screens are now locked and timers reset.`
      );
      await loadData();
    } catch (err: any) {
      alert(`Failed to end phase: ${err.message}`);
    } finally {
      setSavingPhase(null);
    }
  };

  const handleSaveConfig = async (phase: PhaseId) => {
    setSavingPhase(phase);
    try {
      const updates = localConfig[phase];
      await api.updatePhaseControl(phase, updates, `Updated ${phase} configuration parameters`);
      setPhases(prev => prev ? ({ ...prev, [phase]: { ...prev[phase], ...updates } }) : prev);
      alert(`Configuration for ${phase.toUpperCase()} saved successfully.`);
    } catch (err: any) {
      alert(`Failed to save configuration: ${err.message}`);
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Current State:{' '}
                        <strong style={{
                          color: p.status === 'active' ? 'var(--emerald-400)' : p.status === 'paused' ? 'var(--amber-400)' : p.status === 'closed' ? 'var(--rose-400)' : 'var(--text-muted)',
                          textTransform: 'uppercase'
                        }}>
                          {p.status}
                        </strong>
                      </div>

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Phase Timer:</span>
                        <CountdownTimer
                          key={`admin-timer-${pId}-${p.status}`}
                          durationSeconds={(p.total_deadline_minutes || (pId === 'phase1' ? 15 : 20)) * 60}
                          startTimeMs={p.start_time ? new Date(p.start_time).getTime() : undefined}
                          label="Phase Clock"
                          size="sm"
                          isReset={p.status === 'closed'}
                        />
                        {p.status === 'closed' && (
                          <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                            RESET (00:00)
                          </span>
                        )}
                      </div>
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

                  {p.status !== 'closed' ? (
                    <button
                      onClick={() => handleEndPhase(pId)}
                      disabled={savingPhase === pId}
                      className="btn btn-danger btn-sm"
                      style={{
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        boxShadow: '0 0 10px rgba(220, 38, 38, 0.4)'
                      }}
                      title="End Phase: Forcibly submits all active participant answers, permanently locks screens, and resets timers"
                    >
                      <Lock size={14} /> End Phase & Lock All
                    </button>
                  ) : (
                    <span
                      className="badge badge-rose"
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 700
                      }}
                    >
                      <Lock size={12} /> PHASE ENDED & LOCKED
                    </span>
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
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                <div style={{
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
                      value={localConfig[pId]?.default_question_timer ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setLocalConfig(prev => ({
                          ...prev,
                          [pId]: { ...prev[pId], default_question_timer: val }
                        }));
                      }}
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
                      value={localConfig[pId]?.total_deadline_minutes ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setLocalConfig(prev => ({
                          ...prev,
                          [pId]: { ...prev[pId], total_deadline_minutes: val }
                        }));
                      }}
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
                      value={localConfig[pId]?.qualification_limit ?? 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setLocalConfig(prev => ({
                          ...prev,
                          [pId]: { ...prev[pId], qualification_limit: val }
                        }));
                      }}
                    />
                    <span className="form-hint">Default: Top 15 (P1), Top 5 (P2)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => handleSaveConfig(pId)}
                    disabled={savingPhase === pId}
                    className="btn btn-secondary btn-sm"
                  >
                    {savingPhase === pId ? 'Saving...' : `Save ${pId.toUpperCase()} Configuration`}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
