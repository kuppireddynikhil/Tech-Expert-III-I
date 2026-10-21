// TECH EXPERT 2K26 — PARTICIPANT WAITING ROOM
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { PhaseControl, PhaseId, CompetitionSettings, PhaseLeaderboardEntry } from '../types';
import {
  Clock,
  Zap,
  Code2,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Users,
  ShieldCheck,
  RefreshCw,
  Info,
  ChevronLeft
} from 'lucide-react';

export const WaitingRoom: React.FC = () => {
  const { phase } = useParams<{ phase: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const phaseId = (phase || 'phase1') as PhaseId;

  const [phaseControl, setPhaseControl] = useState<PhaseControl | null>(null);
  const [settings, setSettings] = useState<CompetitionSettings | null>(null);
  const [assignedSet, setAssignedSet] = useState<any>(null);
  const [qualification, setQualification] = useState<string>('qualified');
  const [leaderboard, setLeaderboard] = useState<PhaseLeaderboardEntry[]>([]);
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [error, setError] = useState<string>('');

  const countdownTriggeredRef = useRef(false);

  const isExamLive = Boolean(phaseControl?.exam_started_at);
  const isActivated = Boolean(phaseControl?.is_activated || phaseControl?.status === 'active');
  const isClosed = phaseControl?.status === 'closed';

  // Load authoritative phase status and waiting room data
  const checkPhaseStatus = async (isBackgroundPoll = false) => {
    try {
      if (isBackgroundPoll) setPolling(true);

      const [controls, setts, count] = await Promise.all([
        api.getPhaseControls(),
        api.getCompetitionSettings(),
        api.getWaitingRoomCount(phaseId)
      ]);

      const p = controls[phaseId];
      setPhaseControl(p);
      setSettings(setts);
      setWaitingCount(count);
      setLastChecked(new Date());

      // If phase 2 or 3, check participant qualification
      let currentQual = qualification;
      if (phaseId !== 'phase1') {
        currentQual = await api.getMyQualification(phaseId);
        setQualification(currentQual);
      }

      // Automatically trigger 3-second countdown when admin starts exam
      const isLive = Boolean(p?.exam_started_at);
      const isDisq = profile?.registration_status === 'disqualified';
      const isNotQual = phaseId !== 'phase1' && currentQual === 'not_qualified';
      const isNotPub = phaseId !== 'phase1' && currentQual === 'not_published';
      const isClosedPhase = p?.status === 'closed';

      if (isLive && !countdownTriggeredRef.current && !isDisq && !isNotQual && !isNotPub && !isClosedPhase) {
        countdownTriggeredRef.current = true;
        setCountdown(3);
      }

      // Fetch assigned question set name
      try {
        const set = await api.getParticipantAssignedSet(phaseId);
        setAssignedSet(set);
      } catch (e) {
        // May not be assigned yet
      }

      // Load run-specific phase leaderboard if visibility enabled
      if (setts.leaderboard_visible) {
        const runNum = p?.current_run_number || 1;
        const lb = await api.getPhaseLeaderboard(phaseId, runNum);
        setLeaderboard(lb);
      }
    } catch (err: any) {
      console.error('Waiting room status check error:', err);
      if (!isBackgroundPoll) {
        setError(err.message || 'Unable to connect to exam server.');
      }
    } finally {
      if (isBackgroundPoll) setPolling(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPhaseStatus();

    // Controlled live polling: poll every 2 seconds to detect exam start instantly
    const interval = setInterval(() => {
      checkPhaseStatus(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [phaseId]);

  // Handle authoritative 3-second countdown when admin starts exam
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      const meta = getPhaseMeta();
      navigate(meta.examRoute, { replace: true });
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const getPhaseMeta = () => {
    switch (phaseId) {
      case 'phase1':
        return {
          title: 'Phase 1: Quick Quiz',
          icon: <Zap size={24} color="var(--color-primary)" />,
          examRoute: '/phase1',
          rules: [
            '20 multiple-choice questions assessing Python foundations, syntax nuances, data structures, and operators.',
            'Each question has a strict 15-second countdown timer. If unselected, 0 points are assigned.',
            'Top 15 participants on the live leaderboard will qualify for Phase 2.'
          ]
        };
      case 'phase2':
        return {
          title: 'Phase 2: Code Debugging Challenge',
          icon: <Code2 size={24} color="var(--color-primary)" />,
          examRoute: '/phase2',
          rules: [
            'Inspect and fix broken starter code snippets inside the Monaco Editor.',
            '15-minute global deadline for the entire phase.',
            'AI-automated grading evaluates correctness and test coverage.',
            'Top 5 participants qualify for the Grand Finals in Phase 3.'
          ]
        };
      case 'phase3':
        return {
          title: 'Phase 3: Logic Builder (Finals)',
          icon: <Trophy size={24} color="var(--color-warning)" />,
          examRoute: '/phase3',
          rules: [
            '3 complex logic implementation problems. You may solve them in any order.',
            'Strict constraint: You have exactly 3 Run attempts per program.',
            'If 3 attempts fail, the problem becomes permanently locked.',
            'The first finalist to correctly solve all programs wins the championship.'
          ]
        };
      default:
        return {
          title: 'Competition Waiting Room',
          icon: <Zap size={24} color="var(--color-primary)" />,
          examRoute: '/dashboard',
          rules: ['Follow instructions provided by the event organizers.']
        };
    }
  };

  const meta = getPhaseMeta();

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div
          className="spinner"
          style={{
            width: '40px',
            height: '40px',
            margin: '0 auto 1.25rem auto',
            border: '3px solid var(--color-primary-light)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%'
          }}
        />
        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text)', marginBottom: '0.5rem' }}>
          Connecting to Waiting Room...
        </h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Verifying participant eligibility and phase activation status.
        </p>
      </div>
    );
  }

  // Revocation / Disqualification / Ineligible Checks
  const isDisqualified = profile?.registration_status === 'disqualified';
  const isIneligible = phaseId !== 'phase1' && qualification === 'not_qualified';
  const isNotPublished = phaseId !== 'phase1' && qualification === 'not_published';

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Navigation & Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 500
          }}
        >
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: polling ? 'var(--color-primary)' : 'var(--color-success)',
              boxShadow: polling ? '0 0 6px var(--color-primary)' : '0 0 6px var(--color-success)',
              transition: 'all 0.3s'
            }}
          />
          <span>Live Sync Active • Last updated: {lastChecked.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main Waiting Room Hero Card */}
      <div className="glass-card" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Run Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {meta.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                  RUN #{phaseControl?.current_run_number || 1}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Tech Expert 2K26 • SVCE
                </span>
              </div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--color-text)' }}>
                {meta.title}
              </h1>
            </div>
          </div>

          {/* Current State Badge */}
          <div>
            {isClosed ? (
              <span className="badge badge-rose" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                PHASE CONCLUDED & LOCKED
              </span>
            ) : isExamLive ? (
              <span className="badge badge-emerald" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-success)',
                    animation: 'pulse 1.5s infinite'
                  }}
                />
                EXAM IS LIVE
              </span>
            ) : isActivated ? (
              <span className="badge badge-amber" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} />
                WAITING ROOM OPEN (EXAM NOT STARTED)
              </span>
            ) : (
              <span className="badge badge-cyan" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                PHASE LOCKED
              </span>
            )}
          </div>
        </div>

        {/* Waiting Room Live Stats & Assigned Question Set */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--color-primary-light)',
              border: '1px solid #BFDBFE',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Users size={18} color="var(--color-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Participants in Waiting Room
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{waitingCount}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} /> Joined
                </span>
              </div>
            </div>
          </div>

          {assignedSet && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--color-border)',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <ShieldCheck size={20} color="var(--color-primary)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Assigned Question Set
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {assignedSet.set_name || assignedSet.name}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Status Notification Box */}
        {isDisqualified ? (
          <div
            className="alert alert-danger"
            style={{ padding: '1.25rem', marginBottom: '1.75rem' }}
          >
            <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '0.35rem', color: 'inherit' }}>
                Account Disqualified / Revoked
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                Your participation account has been suspended or disqualified by the competition administrators. You are not authorized to participate in this phase.
              </p>
            </div>
          </div>
        ) : isIneligible ? (
          <div
            className="alert alert-danger"
            style={{ padding: '1.25rem', marginBottom: '1.75rem' }}
          >
            <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '0.35rem', color: 'inherit' }}>
                Not Qualified for {meta.title}
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                You did not meet the advancement criteria from the previous phase. Thank you for participating in Tech Expert 2K26!
              </p>
            </div>
          </div>
        ) : isNotPublished ? (
          <div
            className="alert alert-warning"
            style={{ padding: '1.25rem', marginBottom: '1.75rem' }}
          >
            <Info size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '0.35rem', color: 'inherit' }}>
                Advancement Results Pending
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                The event administrators have not yet finalized and published the list of participants advancing to {meta.title}. Please check back shortly.
              </p>
            </div>
          </div>
        ) : isClosed ? (
          <div
            className="alert alert-danger"
            style={{ padding: '1.25rem', marginBottom: '1.75rem' }}
          >
            <Lock size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '0.35rem', color: 'inherit' }}>
                Phase Concluded
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                This phase has ended and all active sessions are locked. Check the official leaderboard for rankings.
              </p>
            </div>
          </div>
        ) : isExamLive ? (
          <div
            className="alert alert-success"
            style={{ padding: '1.25rem', marginBottom: '1.75rem' }}
          >
            <CheckCircle2 size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '0.35rem', color: 'inherit' }}>
                Examination Has Officially Started!
              </h4>
              <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: 1.5 }}>
                The organizer has pressed <strong>Start Exam</strong>. All participants are entering together. Synchronizing session...
              </p>
            </div>
          </div>
        ) : isActivated ? (
          <div
            className="alert alert-info"
            style={{ padding: '1.25rem', marginBottom: '1.75rem' }}
          >
            <Clock size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '0.35rem', color: 'inherit' }}>
                Waiting for Organizer to Start Exam
              </h4>
              <p style={{ fontSize: '0.925rem', margin: 0, lineHeight: 1.6 }}>
                The administrator has activated this phase. Please wait until the exam officially starts. Keep this page open.
              </p>
              <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.9 }}>
                This page will automatically start a 3-second countdown and launch your exam as soon as the administrator begins the test.
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--color-border)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: '1.75rem'
            }}
          >
            <Lock size={24} color="var(--color-text-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ color: 'var(--color-text)', fontWeight: 700, marginBottom: '0.35rem' }}>
                Phase Not Yet Activated
              </h4>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                The administrator has not activated this phase yet. Please wait for the announcement.
              </p>
            </div>
          </div>
        )}

        {/* Waiting Room Real-time Live Guidance */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.25rem',
            flexWrap: 'wrap',
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--color-border)',
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {countdown !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid var(--color-primary-light)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
                <span>Synchronizing exam start in {countdown}s... Entering automatically!</span>
              </div>
            ) : isClosed ? (
              <span style={{ color: 'var(--color-danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} /> Phase is concluded and locked.
              </span>
            ) : isDisqualified || isIneligible ? (
              <span style={{ color: 'var(--color-danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} /> You are not authorized for this phase.
              </span>
            ) : isExamLive ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-success)',
                    animation: 'pulse 1s infinite'
                  }}
                />
                <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.95rem' }}>
                  Exam launched by administrator! Transitioning all participants automatically...
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    animation: 'pulse 1.5s infinite'
                  }}
                />
                <span style={{ color: 'var(--color-text)', fontSize: '0.925rem', fontWeight: 500 }}>
                  Standing by in Waiting Room. As soon as the administrator clicks <strong>Start Exam</strong>, a 3-second countdown will start and launch your exam automatically.
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => checkPhaseStatus(true)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
          >
            <RefreshCw size={16} className={polling ? 'spinner' : ''} /> Sync Status
          </button>
        </div>
      </div>

      {/* Phase Rules & Instructions */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <ShieldCheck size={20} color="var(--color-primary)" />
          Phase Guidelines & Rules
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {meta.rules.map((rule, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.925rem', color: 'var(--color-text-secondary)' }}>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '1px'
                }}
              >
                {idx + 1}
              </div>
              <span style={{ lineHeight: 1.5 }}>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Run-Specific Phase Leaderboard */}
      {settings?.leaderboard_visible && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Trophy size={20} color="var(--color-warning)" />
                {meta.title} — Live Standings (Run #{phaseControl?.current_run_number || 1})
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                Official participant scores for the current active run.
              </p>
            </div>
            <span className="badge badge-amber" style={{ fontSize: '0.8rem' }}>
              {leaderboard.length} Participant{leaderboard.length === 1 ? '' : 's'} Participated
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-secondary)' }}>
              <Users size={36} color="var(--color-disabled)" style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ fontSize: '0.95rem', margin: 0 }}>
                No participant submissions recorded for Run #{phaseControl?.current_run_number || 1} yet.
              </p>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Scores will populate live as participants complete their attempts.
              </p>
            </div>
          ) : (
            <div className="custom-table-container">
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '70px', textAlign: 'center' }}>Rank</th>
                    <th>Participant</th>
                    <th>Section</th>
                    <th>Year</th>
                    <th style={{ textAlign: 'right' }}>Score / Result</th>
                    <th>Performance Details</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.user_id}
                      style={{
                        backgroundColor: entry.user_id === user?.id ? 'var(--color-primary-light)' : undefined
                      }}
                    >
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        {entry.rank === 1 ? '🥇 1' : entry.rank === 2 ? '🥈 2' : entry.rank === 3 ? '🥉 3' : `#${entry.rank}`}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {entry.full_name}
                          {entry.user_id === user?.id && (
                            <span className="badge badge-cyan" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                              YOU
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{entry.email}</div>
                      </td>
                      <td>Section {entry.section}</td>
                      <td>Year {entry.academic_year}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                        {entry.score} pts
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {entry.detail || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Authoritative 3-Second Exam Launch Countdown Modal Overlay */}
      {countdown !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: '3rem',
              maxWidth: '520px',
              width: '100%',
              boxShadow: 'var(--shadow-modal)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                border: '2px solid var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <Zap size={36} color="var(--color-primary)" />
            </div>

            <span className="badge badge-cyan" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', marginBottom: '0.75rem' }}>
              EXAM STARTING NOW
            </span>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
              {meta.title} Starts In
            </h2>

            <div
              key={countdown}
              style={{
                fontSize: '5.5rem',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                lineHeight: 1,
                margin: '1rem 0',
                color: 'var(--color-primary)'
              }}
            >
              {countdown === 0 ? 'GO!' : countdown}
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
              All participants enter together. Questions and timers are synchronized across all screens.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
