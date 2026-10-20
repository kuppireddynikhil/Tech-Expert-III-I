// TECH EXPERT 2K26 — PHASE 1: PYTHON QUICK QUIZ
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CountdownTimer } from '../components/common/CountdownTimer';
import type { Question, PhaseControl, CompetitionSession } from '../types';
import confetti from 'canvas-confetti';
import { 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Trophy,
  Layers,
  HelpCircle,
  ShieldAlert,
  RotateCcw,
  Lock
} from 'lucide-react';

// How long the revealed answer stays on screen before auto-advancing
const REVEAL_DURATION_MS = 3000;

export const Phase1: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [phaseControl, setPhaseControl] = useState<PhaseControl | null>(null);
  const [questionSet, setQuestionSet] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ is_correct: boolean; points_awarded: number; correct_answers?: string[] } | null>(null);
  const [session, setSession] = useState<CompetitionSession | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Single Attempt & Re-entry Access Control State
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [reentryReason, setReentryReason] = useState('');
  const [reentrySubmitting, setReentrySubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Authoritative question timer start tracking
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Guards so a question is only finalized / advanced once (declared before loadQuiz)
  const finalizingRef = useRef<string | null>(null);
  const selectedChoiceRef = useRef<string | null>(null);
  selectedChoiceRef.current = selectedChoice;

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError('');

      const controls = await api.getPhaseControls();
      const p1 = controls.phase1;
      setPhaseControl(p1);

      if (p1.status === 'closed') {
        setAccessBlocked(true);
        setBlockedReason('Phase 1 has concluded and was closed by the administrator. All participant answers have been recorded, and this phase is locked.');
        setLoading(false);
        return;
      }

      if (p1.status !== 'active' && !p1.is_activated) {
        setError(`Phase 1 is currently ${p1.status}. It must be activated by the administrator to begin.`);
        setLoading(false);
        return;
      }

      // If phase is activated but exam has NOT officially started, redirect to Waiting Room
      if (!p1.exam_started_at) {
        navigate('/waiting-room/phase1', { replace: true });
        return;
      }

      const set = await api.getParticipantAssignedSet('phase1');
      setQuestionSet(set);
      const qList = set.questions || [];
      setQuestions(qList);

      // Authoritative Session Fetch or Single Attempt Creation
      const { session: currentSession, isNew } = await api.getOrCreateSession('phase1', set.set_id);
      setSession(currentSession);

      // Enforce Single Exam Attempt & Administrator-Only Re-entry policy
      const isCompleted = currentSession.status === 'completed';
      const isLocked = Boolean(currentSession.is_locked);
      const isFreshApproved = currentSession.reentry_status === 'approved_fresh';
      const isResumeApproved = currentSession.reentry_status === 'approved_resume';

      if (isCompleted && !isFreshApproved) {
        setAccessBlocked(true);
        setBlockedReason('Exam Completed. In accordance with competition policy, a participant can start an exam only once by default. Unauthorized re-entry is blocked. Contact your administrator to request re-entry.');
        setLoading(false);
        return;
      }

      if (isLocked && !isResumeApproved && !isFreshApproved) {
        setAccessBlocked(true);
        setBlockedReason(currentSession.reentry_reason || 'Exam Session Locked. Unauthorized re-entry is blocked. Only an authorized administrator can grant re-entry.');
        setLoading(false);
        return;
      }

      // Participant is authorized to continue
      setAccessBlocked(false);

      // Track active tab to distinguish unexpected exit
      sessionStorage.setItem(`svce_active_exam_p1_${currentSession.id}`, 'active');

      // Load previous answers to restore state and score safely
      const previousResponses = await api.getSessionResponses(currentSession.id);
      let targetIndex = currentSession.current_question_index || 0;
      if (previousResponses.length > targetIndex) {
        targetIndex = previousResponses.length;
      }

      // If all questions are completed
      if (targetIndex >= qList.length && qList.length > 0) {
        setQuizCompleted(true);
        setTotalScore(currentSession.final_score || 0);
        setLoading(false);
        return;
      }

      setCurrentIndex(targetIndex);
      setTotalScore(currentSession.final_score || 0);

      // Authoritative question timer calculation
      const currentQ = qList[targetIndex];
      const timerSecs = currentQ?.custom_timer || currentQ?.effective_timer || set?.default_timer || 15;

      if (currentSession.current_question_started_at && !isNew) {
        const elapsed = Math.floor((Date.now() - new Date(currentSession.current_question_started_at).getTime()) / 1000);
        if (elapsed >= timerSecs) {
          // Timer expired during reload or disconnect: finalize question
          setQuestionStartTime(Date.now() - timerSecs * 1000);
          finalizingRef.current = currentQ.id;
          api.submitQuizAnswer(currentSession.id, currentQ.id, 'NONE', timerSecs)
            .then(res => {
              setLastResult(res);
              setTotalScore(res.total_score);
            })
            .catch(console.error);
        } else {
          setQuestionStartTime(Date.now() - (elapsed * 1000));
        }
      } else {
        setQuestionStartTime(Date.now());
      }

    } catch (err: any) {
      console.error('Failed to load quiz:', err);
      setError(err.message || 'Failed to load assigned question set.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, []);

  // Lock session on page exit / window close
  useEffect(() => {
    if (!session || accessBlocked || quizCompleted) return;

    const handleBeforeUnload = () => {
      api.lockSession(session.id, 'Participant exited or closed exam window');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session, accessBlocked, quizCompleted]);

  const currentQuestion = questions[currentIndex];
  const effectiveTimer = currentQuestion?.custom_timer || currentQuestion?.effective_timer || questionSet?.default_timer || 15;
  const isPaused = phaseControl?.status === 'paused';

  // Periodic Phase Status & Force Closure Check
  useEffect(() => {
    if (quizCompleted || accessBlocked) return;

    const interval = setInterval(async () => {
      try {
        const controls = await api.getPhaseControls();
        const p1 = controls.phase1;
        setPhaseControl(p1);

        if (p1 && p1.status === 'closed') {
          // Administrator ended Phase 1 for all participants
          if (currentQuestion && session && finalizingRef.current !== currentQuestion.id) {
            finalizingRef.current = currentQuestion.id;
            const answerToSubmit = selectedChoiceRef.current || 'NONE';
            api.submitQuizAnswer(session.id, currentQuestion.id, answerToSubmit, effectiveTimer).catch(console.error);
          }
          if (session) {
            api.lockSession(session.id, 'Phase 1 was formally closed by administrator.').catch(console.error);
          }
          setAccessBlocked(true);
          setBlockedReason('Phase 1 has been concluded and closed by the administrator. Your exam has been automatically submitted and your screen is locked.');
          sessionStorage.removeItem(`svce_active_exam_p1_${session?.id}`);
        }
      } catch (e) {
        // network hiccup
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [quizCompleted, accessBlocked, currentQuestion, session, effectiveTimer]);

  const handleSelectChoice = (choiceId: string) => {
    if (submitting || lastResult || isPaused) return;
    setSelectedChoice(choiceId);
  };

  // Triggered STRICTLY when the question answering countdown expires (same time for all participants)
  const handleTimerExpire = useCallback(async () => {
    if (!currentQuestion || !session || isPaused) return;
    if (finalizingRef.current === currentQuestion.id) return;
    finalizingRef.current = currentQuestion.id;

    setSubmitting(true);
    const answerToSubmit = selectedChoiceRef.current || 'NONE';

    try {
      const response = await api.submitQuizAnswer(
        session.id,
        currentQuestion.id,
        answerToSubmit,
        effectiveTimer
      );

      setLastResult({
        is_correct: response.is_correct,
        points_awarded: response.points_awarded,
        correct_answers: response.correct_answers || []
      });
      setTotalScore(response.total_score);
    } catch (err: any) {
      console.error('Error submitting quiz answer:', err);
      setLastResult({ is_correct: false, points_awarded: 0, correct_answers: [] });
    } finally {
      setSubmitting(false);
    }
  }, [currentQuestion, session, effectiveTimer, isPaused]);

  // Synchronized Multi-Participant Progression Loop:
  // Every participant sees the same question at the same time and has the exact same submission deadline!
  useEffect(() => {
    if (!phaseControl?.exam_started_at || quizCompleted || accessBlocked || isPaused || questions.length === 0) return;

    const syncInterval = setInterval(() => {
      const quizStartMs = new Date(phaseControl.exam_started_at!).getTime() + 3000;
      const elapsedMs = Math.max(0, Date.now() - quizStartMs);
      const elapsedSecs = Math.floor(elapsedMs / 1000);
      const cycleDuration = effectiveTimer + Math.floor(REVEAL_DURATION_MS / 1000); // 15 + 3 = 18s
      const totalQuizSecs = questions.length * cycleDuration;

      if (elapsedSecs >= totalQuizSecs) {
        if (!quizCompleted) {
          if (session) {
            api.completeSession(session.id, totalScore).catch(console.error);
          }
          setQuizCompleted(true);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        return;
      }

      const syncIndex = Math.floor(elapsedSecs / cycleDuration);
      const secondInCycle = elapsedSecs % cycleDuration;

      if (syncIndex !== currentIndex && syncIndex < questions.length) {
        // Advance question synchronously across all participants
        setCurrentIndex(syncIndex);
        setSelectedChoice(null);
        setLastResult(null);
        finalizingRef.current = null;
        setQuestionStartTime(Date.now() - (secondInCycle * 1000));
        if (session) {
          api.updateSessionProgress(session.id, syncIndex).catch(console.error);
        }
      } else if (secondInCycle >= effectiveTimer && !lastResult) {
        // Deadline reached for current question -> Synchronized auto-submission
        handleTimerExpire();
      }
    }, 500);

    return () => clearInterval(syncInterval);
  }, [
    phaseControl?.exam_started_at,
    quizCompleted,
    accessBlocked,
    isPaused,
    questions.length,
    effectiveTimer,
    currentIndex,
    lastResult,
    session,
    totalScore,
    handleTimerExpire
  ]);

  // Re-entry Request Handler for Participants
  const handleRequestReentry = async () => {
    if (!session || !reentryReason.trim()) return;

    setReentrySubmitting(true);
    try {
      await api.requestReentry(session.id, reentryReason.trim());
      await loadQuiz();
    } catch (err: any) {
      alert(`Failed to submit re-entry request: ${err.message}`);
    } finally {
      setReentrySubmitting(false);
    }
  };

  const checkReentryStatus = async () => {
    setCheckingStatus(true);
    try {
      await loadQuiz();
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto', border: '3px solid rgba(0, 242, 254, 0.2)', borderTopColor: 'var(--cyan-400)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)' }}>Verifying exam session and loading assigned question set...</p>
      </div>
    );
  }

  // Access Blocked Screen: Single Exam Attempt & Administrator-Only Re-entry
  if (accessBlocked) {
    return (
      <div className="container-narrow">
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid var(--amber-400)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <ShieldAlert size={32} color="var(--amber-400)" />
          </div>

          <span className="badge badge-amber" style={{ marginBottom: '0.75rem' }}>
            EXAM ATTEMPT POLICY RESTRICTION
          </span>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Exam Access Restricted
          </h2>

          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            {blockedReason}
          </p>

          {/* Administrative Re-entry Request Section */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            marginBottom: '1.75rem',
            textAlign: 'left'
          }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#FFFFFF' }}>
              Administrator Re-Entry Request
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
              In accordance with SVCE Tech Expert 2K26 examination governance, re-entry requires explicit administrator authorization.
            </p>

            {phaseControl?.status === 'closed' ? (
              <div style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--rose-400)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--rose-400)',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                <Lock size={28} style={{ margin: '0 auto 0.5rem auto' }} />
                <strong style={{ display: 'block', color: '#FFFFFF', marginBottom: '0.3rem', fontSize: '1rem' }}>
                  Phase 1 Concluded & Submissions Locked
                </strong>
                The event administrator has closed Phase 1 for all participants. All answers have been submitted, and re-entry requests are no longer accepted.
                <div style={{ marginTop: '0.75rem', fontSize: '1.15rem', fontWeight: 800, color: 'var(--cyan-400)' }}>
                  Recorded Score: {session?.final_score ?? totalScore} PTS
                </div>
              </div>
            ) : session?.reentry_status === 'requested' ? (
              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid var(--cyan-400)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--cyan-400)',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} />
                  <span>Re-entry request submitted. Waiting for administrator review...</span>
                </div>
                <button
                  onClick={checkReentryStatus}
                  disabled={checkingStatus}
                  className="btn btn-secondary btn-sm"
                >
                  <RotateCcw size={14} />
                  {checkingStatus ? 'Checking...' : 'Check Status'}
                </button>
              </div>
            ) : session?.reentry_status === 'rejected' ? (
              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid var(--rose-400)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--rose-400)',
                fontSize: '0.9rem'
              }}>
                Your re-entry request was reviewed and rejected by the administrator.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="State the reason for re-entry (e.g., unexpected browser restart, network interruption, accidental tab closure)..."
                  value={reentryReason}
                  onChange={(e) => setReentryReason(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
                <button
                  onClick={handleRequestReentry}
                  disabled={reentrySubmitting || !reentryReason.trim()}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start' }}
                >
                  {reentrySubmitting ? 'Submitting Request...' : 'Submit Re-Entry Request'}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {phaseControl?.status !== 'closed' && (
              <button onClick={checkReentryStatus} className="btn btn-secondary">
                Refresh Status
              </button>
            )}
            <Link to="/dashboard" className="btn btn-secondary">
              &larr; Return to Dashboard
            </Link>
            <Link to="/leaderboard" className="btn btn-primary">
              <Trophy size={16} /> View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-narrow">
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--amber-400)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ marginBottom: '1rem' }}>Phase 1 Status Notice</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
          <Link to="/dashboard" className="btn btn-secondary">
            &larr; Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="container-narrow">
        <div className="glass-card-glow" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            margin: '0 auto 1.5rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--emerald-400)'
          }}>
            <Trophy size={36} color="var(--amber-400)" />
          </div>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Phase 1 Completed!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Your answers have been verified and scored on the server.
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2rem',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: '1.5rem 2.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '2.5rem'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Final Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--cyan-400)' }}>{totalScore} pts</div>
            </div>
            <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Questions</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF' }}>{questions.length}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/leaderboard" className="btn btn-primary btn-lg">
              <Trophy size={18} /> View Live Rankings
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-lg">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow">
      {/* Quiz Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-cyan">PHASE 1 — QUICK QUIZ</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{questionSet?.set_name}</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.25rem' }}>
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Authoritative Countdown Timer */}
        <CountdownTimer
          key={`timer-${currentQuestion?.id}`}
          durationSeconds={effectiveTimer}
          startTimeMs={questionStartTime}
          onExpire={handleTimerExpire}
          label="Question Timer"
          size="md"
          isReset={accessBlocked || phaseControl?.status === 'closed'}
          isPaused={isPaused}
        />
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        marginBottom: '2rem'
      }}>
        <div style={{
          width: `${((currentIndex + 1) / questions.length) * 100}%`,
          height: '100%',
          background: 'var(--grad-primary)',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="glass-card" style={{ padding: '2.5rem', position: 'relative' }}>
          {isPaused ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '2px solid var(--amber-400)',
                  boxShadow: '0 0 30px rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto'
                }}
              >
                <Clock size={36} color="var(--amber-400)" />
              </div>
              <span className="badge badge-amber" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                EXAMINATION PAUSED BY ADMINISTRATOR
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                Questions & Timer Paused
              </h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.6, fontSize: '0.95rem' }}>
                The administrator has paused Phase 1. Question content and choices are hidden and the question timer has stopped. Your previous answers are recorded. Please remain on this screen.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--amber-400)', fontSize: '0.9rem', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--amber-400)', animation: 'pulse 1s infinite' }} />
                Waiting for administrator to resume exam...
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                  {currentQuestion.difficulty?.toUpperCase()}
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                  +{currentQuestion.scoring_points} PTS
                </span>
                {currentQuestion.tags?.map((t, idx) => (
                  <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                    #{t}
                  </span>
                ))}
              </div>

              <h3 style={{ fontSize: '1.35rem', lineHeight: 1.5, marginBottom: '2rem' }}>
                {currentQuestion.problem_statement}
              </h3>

          {/* Choices: Disabled once answered; correct answer highlighted in green; wrong selection in red */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
            {currentQuestion.choices?.map((choice) => {
              const isSelected = selectedChoice === choice.id;
              const isCorrectAnswer = Boolean(lastResult?.correct_answers?.includes(choice.id));
              const isIncorrectSelection = Boolean(lastResult && isSelected && !lastResult.is_correct);

              let choiceBorder = isSelected ? 'var(--cyan-400)' : 'var(--border-subtle)';
              let choiceBg = isSelected ? 'rgba(0, 242, 254, 0.12)' : 'rgba(15, 23, 42, 0.6)';

              if (lastResult) {
                if (isCorrectAnswer) {
                  // Highlight correct answer in green on timer expiry
                  choiceBorder = 'var(--emerald-400)';
                  choiceBg = 'rgba(16, 185, 129, 0.22)';
                } else if (isIncorrectSelection) {
                  // Highlight participant's incorrect selection in red
                  choiceBorder = 'var(--rose-400)';
                  choiceBg = 'rgba(244, 63, 94, 0.22)';
                } else {
                  choiceBorder = 'var(--border-subtle)';
                  choiceBg = 'rgba(15, 23, 42, 0.35)';
                }
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => handleSelectChoice(choice.id)}
                  disabled={submitting || Boolean(lastResult)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${choiceBorder}`,
                    backgroundColor: choiceBg,
                    color: '#FFFFFF',
                    textAlign: 'left',
                    cursor: submitting || lastResult ? 'default' : 'pointer',
                    transition: 'all var(--transition-fast)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.95rem'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isCorrectAnswer 
                      ? 'var(--emerald-400)' 
                      : isIncorrectSelection 
                        ? 'var(--rose-400)' 
                        : isSelected 
                          ? 'var(--cyan-400)' 
                          : 'rgba(255, 255, 255, 0.08)',
                    color: (isSelected || isCorrectAnswer || isIncorrectSelection) ? '#031525' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0
                  }}>
                    {choice.id}
                  </div>
                  <span style={{ flex: 1 }}>{choice.text}</span>
                  {lastResult && (
                    isCorrectAnswer ? (
                      <CheckCircle2 size={20} color="var(--emerald-400)" />
                    ) : isIncorrectSelection ? (
                      <XCircle size={20} color="var(--rose-400)" />
                    ) : null
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Footer: Manual Next button removed; Continue button rendered only after timer expiration */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Current Running Score: <strong style={{ color: 'var(--cyan-400)' }}>{totalScore} pts</strong>
            </div>

            {/* While timer is running, manual Next button is removed */}
            {!lastResult && (
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Clock size={16} color="var(--cyan-400)" />
                <span>Timer active — answer locks automatically on expiration</span>
              </div>
            )}

            {/* Result banner — flow advances automatically, no manual button */}
            {lastResult && (
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: lastResult.is_correct ? 'var(--emerald-400)' : 'var(--rose-400)'
              }}>
                {lastResult.is_correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>
                  {lastResult.is_correct
                    ? `Correct! +${lastResult.points_awarded} pts`
                    : selectedChoice ? 'Wrong answer' : "Time's up — no answer selected"}
                  {' · '}
                  {currentIndex + 1 < questions.length ? 'Next question loading…' : 'Finishing exam…'}
                </span>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      )}
    </div>
  );
};
