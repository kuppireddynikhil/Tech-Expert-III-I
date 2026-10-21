// TECH EXPERT 2K26 — PHASE CONTROL & LIFECYCLE MANAGEMENT
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CountdownTimer } from '../../components/common/CountdownTimer';
import type { PhaseControl, PhaseId, PhaseStatus, CompetitionSettings, QuestionSet } from '../../types';
import {
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  Zap,
  Code2,
  Trophy,
  Lock,
  X
} from 'lucide-react';

export const PhaseManagement: React.FC = () => {
  const [phases, setPhases] = useState<Record<PhaseId, PhaseControl> | null>(null);
  const [, setSettings] = useState<CompetitionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPhase, setSavingPhase] = useState<string | null>(null);

  // Modals state
  const [startExamModal, setStartExamModal] = useState<{
    isOpen: boolean;
    phase: PhaseId | null;
    assignedSetName: string;
    reason: string;
  }>({
    isOpen: false,
    phase: null,
    assignedSetName: '',
    reason: 'Exam officially started by administrator'
  });

  const [restartModal, setRestartModal] = useState<{
    isOpen: boolean;
    phase: PhaseId | null;
    questionSets: QuestionSet[];
    selectedSetId: string;
    reason: string;
    loadingSets: boolean;
  }>({
    isOpen: false,
    phase: null,
    questionSets: [],
    selectedSetId: '',
    reason: 'Restarting phase with selected question set',
    loadingSets: false
  });

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

  // 1. ACTIVATE PHASE: Makes phase available and opens waiting room without starting exam
  const handleActivatePhase = async (phase: PhaseId) => {
    const reason = prompt(
      `Enter administrative reason for activating ${phase.toUpperCase()}:\n\n` +
      `Note: This opens the Waiting Room for eligible participants. It does NOT start the exam.`,
      'Phase activated for participant waiting room entry'
    );
    if (!reason) return;

    setSavingPhase(phase);
    try {
      await api.activatePhase(phase, reason);
      alert(`✅ ${phase.toUpperCase()} is now ACTIVATED.\n\n• Waiting Room is now OPEN for eligible participants.\n• Examination questions remain locked.\n• Click "Start Exam" when you are ready to begin the examination.`);
      await loadData();
    } catch (err: any) {
      alert(`Failed to activate phase: ${err.message}`);
    } finally {
      setSavingPhase(null);
    }
  };

  // 2. START EXAM: Confirmation workflow and official start
  const handleOpenStartExam = async (phase: PhaseId) => {
    const p = phases?.[phase];
    if (!p?.is_activated && p?.status !== 'active') {
      alert(`⚠️ Cannot start exam: ${phase.toUpperCase()} must be activated first. Click "Activate Phase" to open the waiting room.`);
      return;
    }
    if (p?.exam_started_at) {
      alert(`ℹ️ Exam for ${phase.toUpperCase()} has already started at ${new Date(p.exam_started_at).toLocaleTimeString()}.`);
      return;
    }

    let setName = 'Default Question Set';
    try {
      const assigned = await api.getParticipantAssignedSet(phase);
      if (assigned?.set_name) setName = assigned.set_name;
    } catch (e) {
      console.log('No specific assigned set found');
    }

    setStartExamModal({
      isOpen: true,
      phase,
      assignedSetName: setName,
      reason: `Official start of ${phase.toUpperCase()} examination`
    });
  };

  const handleConfirmStartExam = async () => {
    if (!startExamModal.phase) return;
    const pId = startExamModal.phase;
    setSavingPhase(pId);
    try {
      await api.startExam(pId, startExamModal.reason);
      setStartExamModal({ isOpen: false, phase: null, assignedSetName: '', reason: '' });
      alert(`🚀 Examination for ${pId.toUpperCase()} is now LIVE!\n\n• Participants waiting in the Waiting Room can now enter.\n• Timers have started.`);
      await loadData();
    } catch (err: any) {
      alert(`Failed to start exam: ${err.message}`);
    } finally {
      setSavingPhase(null);
    }
  };

  // 3. START AGAIN: Destructive reset of active attempt state and new run creation
  const handleOpenRestart = async (phase: PhaseId) => {
    setRestartModal({
      isOpen: true,
      phase,
      questionSets: [],
      selectedSetId: '',
      reason: `Restarting ${phase.toUpperCase()} for all participants`,
      loadingSets: true
    });

    try {
      const sets = await api.getQuestionSets(phase);
      const eligibleSets = sets.filter(s => !s.is_archived);
      setRestartModal(prev => ({
        ...prev,
        questionSets: eligibleSets,
        selectedSetId: eligibleSets[0]?.id || '',
        loadingSets: false
      }));
    } catch (err: any) {
      alert(`Failed to load question sets for ${phase}: ${err.message}`);
      setRestartModal(prev => ({ ...prev, loadingSets: false }));
    }
  };

  const handleConfirmRestart = async () => {
    if (!restartModal.phase || !restartModal.selectedSetId) return;
    const pId = restartModal.phase;
    setSavingPhase(pId);
    try {
      const result = await api.restartPhase(pId, restartModal.selectedSetId, restartModal.reason);
      setRestartModal({
        isOpen: false,
        phase: null,
        questionSets: [],
        selectedSetId: '',
        reason: '',
        loadingSets: false
      });
      alert(
        `🔄 ${pId.toUpperCase()} HAS BEEN RESTARTED (RUN #${result.newRunNumber})\n\n` +
        `• Previous run data has been safely ARCHIVED (historical records preserved).\n` +
        `• Participant active attempts, progress, and timer states have been reset for ${pId.toUpperCase()} only.\n` +
        `• Eligible participants are now in the Waiting Room.\n` +
        `• The new exam is NOT yet started. Press "Start Exam" when ready.`
      );
      await loadData();
    } catch (err: any) {
      alert(`Failed to restart phase: ${err.message}`);
    } finally {
      setSavingPhase(null);
    }
  };

  const handleUpdateStatus = async (phase: PhaseId, newStatus: PhaseStatus) => {
    const reason = prompt(`Enter administrative reason for transitioning ${phase.toUpperCase()} to ${newStatus.toUpperCase()}:`, 'Event schedule transition');
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
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading Phase Lifecycle Matrix...</p>
      </div>
    );
  }

  const phaseList: PhaseId[] = ['phase1', 'phase2', 'phase3'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
          Real-Time Governance
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)' }}>Phase Lifecycle Management</h1>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Activate phases for the waiting room, start examinations, restart phases safely with dedicated question sets, and manage timers.
        </div>
      </div>

      {/* 3 Phase Control Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {phaseList.map((pId) => {
          const p = phases[pId];
          let icon = Zap;
          if (pId === 'phase2') icon = Code2;
          else if (pId === 'phase3') icon = Trophy;

          const IconComponent = icon;
          const isActivated = Boolean(p.is_activated || p.status === 'active');
          const isExamLive = Boolean(p.exam_started_at);
          const isClosed = p.status === 'closed';

          return (
            <div key={pId} className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--color-border)',
                    flexShrink: 0
                  }}>
                    <IconComponent size={24} color="var(--color-primary)" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{pId.toUpperCase()}</span>
                      <span className="badge badge-secondary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        RUN #{p.current_run_number || 1}
                      </span>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>{p.title}</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        Phase State:{' '}
                        {isClosed ? (
                          <strong style={{ color: 'var(--color-danger)' }}>CLOSED & LOCKED</strong>
                        ) : isExamLive ? (
                          <strong style={{ color: 'var(--color-success)' }}>EXAM LIVE ({new Date(p.exam_started_at!).toLocaleTimeString()})</strong>
                        ) : isActivated ? (
                          <strong style={{ color: 'var(--color-warning)' }}>WAITING ROOM OPEN (EXAM NOT STARTED)</strong>
                        ) : (
                          <strong style={{ color: 'var(--color-text-secondary)' }}>INACTIVE / DRAFT</strong>
                        )}
                      </div>

                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Phase Timer:</span>
                        <CountdownTimer
                          key={`admin-timer-${pId}-${p.status}-${p.exam_started_at}`}
                          durationSeconds={(p.total_deadline_minutes || (pId === 'phase1' ? 15 : 20)) * 60}
                          startTimeMs={p.start_time ? new Date(p.start_time).getTime() : undefined}
                          label="Phase Clock"
                          size="sm"
                          isReset={p.status === 'closed' || !p.exam_started_at}
                          isPaused={p.status === 'paused'}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* State Transition Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Distinct Control 1: Activate Phase */}
                  <button
                    onClick={() => handleActivatePhase(pId)}
                    disabled={savingPhase === pId || isClosed}
                    className="btn btn-secondary btn-sm"
                    style={{
                      backgroundColor: isActivated && !isExamLive ? 'var(--color-primary-light)' : undefined,
                      borderColor: isActivated && !isExamLive ? 'var(--color-primary)' : undefined,
                      color: isActivated && !isExamLive ? 'var(--color-primary)' : undefined,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                    title="Activate Phase: Opens Waiting Room for eligible participants. Does NOT start the exam."
                  >
                    <Play size={14} fill="currentColor" /> {isActivated ? 'Phase Active' : 'Activate Phase'}
                  </button>

                  {/* Distinct Control 2: Start Exam */}
                  <button
                    onClick={() => handleOpenStartExam(pId)}
                    disabled={savingPhase === pId || isExamLive || !isActivated || isClosed}
                    className="btn btn-primary btn-sm"
                    style={{
                      opacity: isExamLive ? 0.6 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                    title={isExamLive ? `Exam started at ${new Date(p.exam_started_at!).toLocaleTimeString()}` : 'Start Exam: Authorizes waiting participants to enter the examination'}
                  >
                    <Zap size={14} /> {isExamLive ? 'Exam Live' : 'Start Exam'}
                  </button>

                  {/* Distinct Control 3: Start Again */}
                  <button
                    onClick={() => handleOpenRestart(pId)}
                    disabled={savingPhase === pId}
                    className="btn btn-sm"
                    style={{
                      backgroundColor: '#FEF3C7',
                      borderColor: 'var(--color-warning)',
                      color: 'var(--color-warning)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontWeight: 600
                    }}
                    title="Start Again: Archive previous run, reset attempt counters for this phase, and create new run with a selected question set"
                  >
                    <RotateCcw size={14} /> Start Again
                  </button>

                  {/* Secondary Governance Actions */}
                  {p.status === 'active' && (
                    <button
                      onClick={() => handleUpdateStatus(pId, 'paused')}
                      disabled={savingPhase === pId}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Pause size={14} fill="currentColor" /> Pause
                    </button>
                  )}

                  {p.status === 'paused' && (
                    <button
                      onClick={() => handleUpdateStatus(pId, 'active')}
                      disabled={savingPhase === pId}
                      className="btn btn-secondary btn-sm"
                      style={{
                        backgroundColor: '#DCFCE7',
                        borderColor: 'var(--color-success)',
                        color: 'var(--color-success)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Play size={14} fill="currentColor" /> Resume
                    </button>
                  )}

                  {!isClosed ? (
                    <button
                      onClick={() => handleEndPhase(pId)}
                      disabled={savingPhase === pId}
                      className="btn btn-danger btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 600
                      }}
                      title="End Phase: Forcibly submits all active participant answers, permanently locks screens, and resets timers"
                    >
                      <Lock size={14} /> End Phase & Lock All
                    </button>
                  ) : (
                    <span
                      className="badge badge-danger"
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 700
                      }}
                    >
                      <Lock size={12} /> PHASE LOCKED
                    </span>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(pId, 'draft')}
                    disabled={savingPhase === pId}
                    className="btn btn-secondary btn-sm"
                    title="Reset back to Draft"
                  >
                    Reset to Draft
                  </button>
                </div>
              </div>

              {/* Configuration Inputs */}
              <div style={{
                backgroundColor: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border)',
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
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Default Question Timer</span>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Seconds</span>
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
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Phase Total Deadline</span>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Minutes</span>
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
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Qualification Limit</span>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Qualifiers</span>
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
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

      {/* START EXAM CONFIRMATION MODAL */}
      {startExamModal.isOpen && startExamModal.phase && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={20} color="var(--color-primary)" />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                  Start Exam — {phases?.[startExamModal.phase]?.title}
                </h3>
              </div>
              <button
                onClick={() => setStartExamModal({ isOpen: false, phase: null, assignedSetName: '', reason: '' })}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem'
            }}>
              <p style={{ margin: 0, color: 'var(--color-text)', lineHeight: 1.5 }}>
                You are about to officially <strong>Start the Examination</strong> for <strong>{phases?.[startExamModal.phase]?.title}</strong> (Run #{phases?.[startExamModal.phase]?.current_run_number || 1}).
              </p>
              <ul style={{ margin: '0.75rem 0 0 1.25rem', padding: 0, color: 'var(--color-text-secondary)' }}>
                <li>Eligible participants in the Waiting Room will immediately be authorized to enter the exam.</li>
                <li>Question timers and phase deadlines will begin based on the authoritative server timestamp.</li>
                <li>The Waiting Room status will update live for all connected participants.</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Assigned Question Set</label>
              <div style={{
                backgroundColor: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                color: 'var(--color-primary)',
                fontWeight: 600
              }}>
                {startExamModal.assignedSetName}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Administrative Reason (Audit Log)</label>
              <input
                type="text"
                className="form-input"
                value={startExamModal.reason}
                onChange={(e) => setStartExamModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Schedule commencement at 10:00 AM"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setStartExamModal({ isOpen: false, phase: null, assignedSetName: '', reason: '' })}
                className="btn btn-secondary"
                disabled={savingPhase === startExamModal.phase}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStartExam}
                className="btn btn-primary"
                disabled={savingPhase === startExamModal.phase}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                <Zap size={16} /> Confirm & Start Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* START AGAIN CONFIRMATION MODAL */}
      {restartModal.isOpen && restartModal.phase && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', padding: '2rem', boxShadow: 'var(--shadow-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RotateCcw size={20} color="var(--color-warning)" />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                  Start Again — {phases?.[restartModal.phase]?.title}
                </h3>
              </div>
              <button
                onClick={() => setRestartModal({ isOpen: false, phase: null, questionSets: [], selectedSetId: '', reason: '', loadingSets: false })}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Warning Box */}
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontWeight: 700, marginBottom: '0.5rem' }}>
                <AlertTriangle size={18} />
                DESTRUCTIVE ADMINISTRATIVE ACTION WARNING
              </div>
              <p style={{ margin: 0, color: 'var(--color-text)', lineHeight: 1.5 }}>
                Starting again will <strong>reset the active state</strong> for <strong>{phases?.[restartModal.phase]?.title}</strong>:
              </p>
              <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0, color: 'var(--color-text-secondary)' }}>
                <li>A new run (Run #{(phases?.[restartModal.phase]?.current_run_number || 1) + 1}) will be initiated.</li>
                <li>Previous run data will be <strong>archived and preserved</strong> for administrative audit.</li>
                <li>Participant active attempts, timer states, and answers for this phase will be cleared.</li>
                <li>Participants will be returned to the <strong>Waiting Room</strong> in an un-started state.</li>
                <li><strong>No other phases, registrations, or credentials will be affected.</strong></li>
              </ul>
            </div>

            {/* Question Set Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Select Question Set for the New Run</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Must belong to {restartModal.phase.toUpperCase()}</span>
              </label>

              {restartModal.loadingSets ? (
                <div style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Loading question sets...</div>
              ) : restartModal.questionSets.length === 0 ? (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-warning)',
                  fontSize: '0.85rem'
                }}>
                  ⚠️ No available question sets found for this phase. Please create and publish a question set first in Question Set Management.
                </div>
              ) : (
                <select
                  className="form-select"
                  value={restartModal.selectedSetId}
                  onChange={(e) => setRestartModal(prev => ({ ...prev, selectedSetId: e.target.value }))}
                >
                  {restartModal.questionSets.map(set => (
                    <option key={set.id} value={set.id}>
                      {set.set_name} {set.is_published ? '(Published)' : '(Draft)'} — {set.items?.length || 0} Questions
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Admin Reason Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Mandatory Administrative Reason</label>
              <input
                type="text"
                className="form-input"
                value={restartModal.reason}
                onChange={(e) => setRestartModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Technical difficulty encountered; restarting with Set B"
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setRestartModal({ isOpen: false, phase: null, questionSets: [], selectedSetId: '', reason: '', loadingSets: false })}
                className="btn btn-secondary"
                disabled={savingPhase === restartModal.phase}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestart}
                className="btn btn-warning"
                disabled={savingPhase === restartModal.phase || !restartModal.selectedSetId || restartModal.questionSets.length === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700
                }}
              >
                <RotateCcw size={16} /> Confirm & Start Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
