// TECH EXPERT 2K26 — PHASE 3: PYTHON LOGIC BUILDER (FINALS)
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CountdownTimer } from '../components/common/CountdownTimer';
import type { Question, PhaseControl, AIResponse, CompetitionSession } from '../types';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Play,
  CheckCircle2,
  Lock,
  Clock,
  AlertTriangle,
  FileCode,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const Phase3: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [phaseControl, setPhaseControl] = useState<PhaseControl | null>(null);
  const [questionSet, setQuestionSet] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [attemptsMap, setAttemptsMap] = useState<Record<string, { attempts_used: number; is_solved: boolean; is_locked: boolean }>>({});
  const [evaluating, setEvaluating] = useState(false);
  const [evalResults, setEvalResults] = useState<Record<string, AIResponse>>({});
  const [session, setSession] = useState<CompetitionSession | null>(null);
  const [phaseStartTime, setPhaseStartTime] = useState<number>(Date.now());
  const [isClosed, setIsClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [winnerCelebrated, setWinnerCelebrated] = useState(false);

  useEffect(() => {
    async function loadPhase3() {
      try {
        const controls = await api.getPhaseControls();
        const p3 = controls.phase3;
        setPhaseControl(p3);

        if (p3.status === 'closed') {
          setIsClosed(true);
          setError('Phase 3 has concluded and was closed by the administrator. All finalist submissions are locked.');
          setLoading(false);
          return;
        }

        // Feature 1: Waiting Room Redirect
        if (!p3.exam_started_at) {
          navigate('/waiting-room/phase3');
          return;
        }

        if (p3.status !== 'active') {
          setError(`Phase 3 is currently ${p3.status}. The event administrator must activate Phase 3 to begin the finals.`);
          setLoading(false);
          return;
        }

        const qualification = await api.getMyQualification('phase3');
        if (qualification === 'not_published') {
          setError('The administrator has not yet published the list of participants advancing to Phase 3. Please wait for the announcement.');
          setLoading(false);
          return;
        }
        if (qualification === 'not_qualified') {
          setError('You have not been selected to advance to Phase 3. Thank you for participating!');
          setLoading(false);
          return;
        }

        // Authoritative server-side session tracking & synchronized finals timer
        const { session: currentSession } = await api.getOrCreateSession('phase3');
        setSession(currentSession);
        const startedAtMs = p3.exam_started_at
          ? new Date(p3.exam_started_at).getTime()
          : (currentSession.started_at ? new Date(currentSession.started_at).getTime() : Date.now());
        setPhaseStartTime(startedAtMs);

        const set = await api.getParticipantAssignedSet('phase3');
        setQuestionSet(set);
        const qs = set.questions || [];
        setQuestions(qs);

        // Restore previous submissions, attempt counters, and solved/locked state
        const { attempts, latestRuns } = await api.getParticipantProgramAttempts('phase3');
        const initialCode: Record<string, string> = {};
        const initialAttempts: Record<string, { attempts_used: number; is_solved: boolean; is_locked: boolean }> = {};
        const initialResults: Record<string, AIResponse> = {};

        qs.forEach((q: Question) => {
          initialCode[q.id] = latestRuns[q.id]?.submitted_code || q.starter_code || '# Write your logic implementation here\n';
          const att = attempts[q.id];
          const used = att?.attempts_used ?? 0;
          const solved = Boolean(att?.is_solved);
          const locked = Boolean(att?.is_locked) || (!solved && used >= 3);
          initialAttempts[q.id] = { attempts_used: used, is_solved: solved, is_locked: locked };
          if (latestRuns[q.id]?.ai_response) {
            initialResults[q.id] = latestRuns[q.id].ai_response;
          }
        });

        setCodeMap(initialCode);
        setAttemptsMap(initialAttempts);
        setEvalResults(initialResults);

      } catch (err: any) {
        console.error('Failed to load Phase 3:', err);
        setError(err.message || 'Failed to load assigned questions for Phase 3');
      } finally {
        setLoading(false);
      }
    }
    loadPhase3();
  }, []);

  // Periodic Phase Status & Force Closure / Pause Check
  useEffect(() => {
    if (loading || isClosed) return;

    const interval = setInterval(async () => {
      try {
        const controls = await api.getPhaseControls();
        const p3 = controls.phase3;
        setPhaseControl(p3);
        if (p3 && p3.exam_started_at) {
          setPhaseStartTime(new Date(p3.exam_started_at).getTime());
        }
        if (p3 && p3.status === 'closed') {
          setIsClosed(true);
          if (session) {
            api.lockSession(session.id, 'Phase 3 was formally closed by administrator.').catch(console.error);
          }
        }
      } catch (err) {
        // network error
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [loading, isClosed, session]);

  const isPaused = phaseControl?.status === 'paused';
  const currentQ = questions[activeQuestionIndex];
  const currentAttempt = currentQ ? (attemptsMap[currentQ.id] || { attempts_used: 0, is_solved: false, is_locked: false }) : null;
  const currentEval = currentQ ? evalResults[currentQ.id] : null;

  // Check how many questions are solved
  const solvedCount = Object.values(attemptsMap).filter(a => a.is_solved).length;
  const isAllSolved = solvedCount >= 3 && questions.length >= 3;

  useEffect(() => {
    if (isAllSolved && !winnerCelebrated) {
      setWinnerCelebrated(true);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 }
      });
      if (session && session.status !== 'completed') {
        const totalPoints = questions.reduce((sum, q) => sum + (q.scoring_points || 0), 0);
        api.completeSession(session.id, totalPoints).catch(console.error);
      }
    }
  }, [isAllSolved, winnerCelebrated, session, questions]);

  const handleCodeChange = (val: string | undefined) => {
    if (!currentQ || val === undefined) return;
    if (currentAttempt?.is_locked || currentAttempt?.is_solved || isClosed || phaseControl?.status === 'closed') return;
    setCodeMap(prev => ({ ...prev, [currentQ.id]: val }));
  };

  const handleResetToStarter = () => {
    if (!currentQ || currentAttempt?.is_locked || currentAttempt?.is_solved || isClosed || phaseControl?.status === 'closed') return;
    if (confirm('Reset your code to the starter code template?')) {
      setCodeMap(prev => ({ ...prev, [currentQ.id]: currentQ.starter_code || '# Write your logic implementation here\n' }));
    }
  };

  const handleRunEvaluation = async () => {
    if (!currentQ || evaluating || isClosed || phaseControl?.status === 'closed') return;
    if (currentAttempt?.is_locked) {
      alert('This program is permanently locked after 3 unsuccessful attempts.');
      return;
    }
    if (currentAttempt?.is_solved) {
      alert('This program has already been accepted and solved.');
      return;
    }

    setEvaluating(true);
    const code = codeMap[currentQ.id] || '';

    try {
      const response = await api.submitCodeRun({
        question_id: currentQ.id,
        phase: 'phase3',
        submitted_code: code
      });

      setEvalResults(prev => ({ ...prev, [currentQ.id]: response }));

      // Update attempt counters
      const serverAttemptStatus = response.attempt_status || {};
      const newAttemptsUsed = serverAttemptStatus.attempts_used ?? (currentAttempt?.attempts_used || 0) + 1;
      const isAccepted = Boolean(response.accepted);
      const isLocked = !isAccepted && newAttemptsUsed >= 3;

      setAttemptsMap(prev => ({
        ...prev,
        [currentQ.id]: {
          attempts_used: newAttemptsUsed,
          is_solved: isAccepted,
          is_locked: isLocked
        }
      }));

    } catch (err: any) {
      console.error('Run evaluation failed:', err);
      setEvalResults(prev => ({
        ...prev,
        [currentQ.id]: {
          status: 'failed',
          predicted_output: `[System Notice] ${err.message}`,
          error_type: 'ExecutionError',
          error_message: err.message,
          syntax_valid: false,
          requirements_met: false,
          accepted: false,
          issues: ['Provider or system request error. Attempt not consumed.'],
          explanation: err.message
        }
      }));
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto', border: '3px solid rgba(244, 63, 94, 0.2)', borderTopColor: 'var(--rose-400)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Phase 3 Logic Builder Finals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-narrow">
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--amber-400)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ marginBottom: '1rem' }}>Phase 3 Finals Notice</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
          <Link to="/dashboard" className="btn btn-secondary">
            &larr; Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Finals Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.25rem 1.75rem',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-rose)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--grad-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trophy size={22} color="var(--amber-400)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-rose">PHASE 3 FINALS</span>
              <strong style={{ color: '#FFFFFF', fontSize: '1.15rem' }}>Python Logic Builder</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Top 5 Finalists • Max 3 Attempts Per Program • 1st to complete all 3 wins
            </div>
          </div>
        </div>

        {/* Phase Countdown Timer & Global Progress Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <CountdownTimer
            durationSeconds={(phaseControl?.total_deadline_minutes || 30) * 60}
            startTimeMs={phaseStartTime}
            label="Finals Deadline"
            size="md"
            onExpire={() => {}}
            isReset={isClosed || phaseControl?.status === 'closed'}
            isPaused={isPaused}
          />

          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
              Finals Progress
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isAllSolved ? 'var(--emerald-400)' : 'var(--amber-400)' }}>
              {solvedCount} / {questions.length} Solved
            </div>
          </div>
        </div>
      </div>

      {/* Forced Closure Banner */}
      {(isClosed || phaseControl?.status === 'closed') && (
        <div className="glass-card" style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid var(--rose-400)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <Lock size={24} color="var(--rose-400)" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ color: '#FFFFFF', margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              Phase 3 Finals Concluded & Submissions Locked
            </h4>
            <p style={{ color: 'var(--rose-200)', margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>
              The event administrator has closed Phase 3. Submissions are finalized, the timer is reset to 00:00, and all editor inputs are locked.
            </p>
          </div>
        </div>
      )}

      {/* Completion Banner */}
      {isAllSolved && (
        <div className="glass-card-glow" style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Sparkles size={28} color="var(--amber-400)" />
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF' }}>All 3 Logic Programs Solved!</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Your completion timestamp has been recorded. Check the official leaderboard for winner certification!
              </div>
            </div>
          </div>
          <Link to="/leaderboard" className="btn btn-primary">
            View Live Leaderboard <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Examination Paused Screen (Hides questions and editor) */}
      {isPaused ? (
        <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
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
            Phase 3 Finals & Timer Paused
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 1.5rem auto', lineHeight: 1.6, fontSize: '0.95rem' }}>
            The administrator has temporarily paused Phase 3 Grand Finals. The algorithmic questions and editor are hidden and the finals timer has stopped. Your code has been safely preserved. Please remain on this screen.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--amber-400)', fontSize: '0.9rem', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--amber-400)', animation: 'pulse 1s infinite' }} />
            Waiting for administrator to resume Phase 3...
          </div>
        </div>
      ) : (
        <>
          {/* Program Selector Tabs with Attempts Status */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {questions.map((q, idx) => {
          const isActive = idx === activeQuestionIndex;
          const attempt = attemptsMap[q.id] || { attempts_used: 0, is_solved: false, is_locked: false };

          let statusBadgeClass = 'badge-cyan';
          let statusText = `Attempts: ${attempt.attempts_used}/3`;

          if (attempt.is_solved) {
            statusBadgeClass = 'badge-emerald';
            statusText = 'SOLVED';
          } else if (attempt.is_locked) {
            statusBadgeClass = 'badge-rose';
            statusText = 'LOCKED';
          } else if (attempt.attempts_used === 2) {
            statusBadgeClass = 'badge-amber';
            statusText = 'FINAL ATTEMPT';
          }

          return (
            <button
              key={q.id}
              onClick={() => setActiveQuestionIndex(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'rgba(244, 63, 94, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                border: isActive ? '1px solid var(--rose-400)' : '1px solid var(--border-subtle)',
                color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              {attempt.is_locked ? (
                <Lock size={16} color="var(--rose-400)" />
              ) : attempt.is_solved ? (
                <CheckCircle2 size={16} color="var(--emerald-400)" />
              ) : (
                <FileCode size={16} color="var(--cyan-400)" />
              )}
              <span>Program {idx + 1}: {q.title}</span>
              <span className={`badge ${statusBadgeClass}`} style={{ fontSize: '0.65rem' }}>
                {statusText}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Split Layout */}
      {currentQ && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(350px, 420px) 1fr',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}>
          {/* Left Column: Problem Description & Locked Safeguard */}
          <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', maxHeight: '720px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-rose">{currentQ.difficulty?.toUpperCase()}</span>
                <span className="badge badge-emerald">+{currentQ.scoring_points} PTS</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', lineHeight: 1.4 }}>{currentQ.title}</h3>
            </div>

            {/* Permanent Lock Warning */}
            {currentAttempt?.is_locked && (
              <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <Lock size={20} color="var(--rose-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--rose-400)', marginBottom: '0.2rem' }}>
                    Program Permanently Locked
                  </strong>
                  You have exhausted all 3 evaluation attempts for this program. You cannot submit further runs for this challenge. Please switch to another available program.
                </div>
              </div>
            )}

            {/* Solved Success Banner */}
            {currentAttempt?.is_solved && (
              <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <CheckCircle2 size={20} color="var(--emerald-400)" />
                <div>
                  <strong>Challenge Accepted!</strong> Program is fully solved and points awarded.
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.4rem' }}>
                Problem Statement & Specifications
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {currentQ.problem_statement}
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <strong style={{ color: 'var(--amber-400)' }}>Phase 3 Attempt Policy:</strong>
              <p style={{ marginTop: '0.3rem', lineHeight: 1.5 }}>
                Every valid "Run & AI Evaluate" click consumes 1 attempt. After 3 unsuccessful attempts, this program is permanently locked on the server.
              </p>
            </div>
          </div>

          {/* Right Column: Editor & AI Console */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass-card" style={{ overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
              {/* Header Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 1rem',
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                  <Terminal size={14} color="var(--rose-400)" />
                  <span>solution.py</span>
                  <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                    Used: {currentAttempt?.attempts_used || 0} / 3 Attempts
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={handleResetToStarter}
                    disabled={Boolean(currentAttempt?.is_locked) || Boolean(currentAttempt?.is_solved) || isClosed || Boolean(phaseControl?.status === 'closed')}
                    className="btn btn-secondary btn-sm"
                    title="Reset to starter code"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>

                  <button
                    onClick={handleRunEvaluation}
                    disabled={evaluating || Boolean(currentAttempt?.is_locked) || Boolean(currentAttempt?.is_solved) || isClosed || Boolean(phaseControl?.status === 'closed')}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.45rem 1.25rem' }}
                  >
                    {isClosed || phaseControl?.status === 'closed' ? (
                      <>
                        <Lock size={14} /> Finals Closed & Locked
                      </>
                    ) : evaluating ? (
                      <>
                        <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%' }} />
                        Gemini Evaluating Code...
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="#031525" /> Run Attempt ({(currentAttempt?.attempts_used || 0) + 1}/3)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Monaco Editor */}
              <div style={{ height: '380px' }}>
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  language="python"
                  theme="vs-dark"
                  value={codeMap[currentQ.id] || ''}
                  onChange={handleCodeChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    readOnly: Boolean(currentAttempt?.is_locked) || Boolean(currentAttempt?.is_solved) || isClosed || Boolean(phaseControl?.status === 'closed'),
                    automaticLayout: true,
                    tabSize: 4,
                    insertSpaces: true,
                    fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace"
                  }}
                />
              </div>
            </div>

            {/* AI Simulated Output Console */}
            <div className="glass-card" style={{ padding: '1.25rem', backgroundColor: 'rgba(7, 11, 20, 0.95)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', fontWeight: 700 }}>
                  <Cpu size={15} color="var(--rose-400)" />
                  <span>AI Simulated Python Execution Console</span>
                </div>
                {currentEval && (
                  <span className={`badge ${currentEval.accepted ? 'badge-emerald' : 'badge-rose'}`}>
                    {currentEval.accepted ? 'ACCEPTED' : 'INCORRECT'}
                  </span>
                )}
              </div>

              {currentEval ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: currentEval.accepted ? 'var(--emerald-400)' : '#FDA4AF',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {currentEval.predicted_output || 'No output produced'}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>Evaluation Verdict:</strong> {currentEval.explanation}
                  </div>

                  {currentEval.issues && currentEval.issues.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--rose-400)' }}>
                      <strong>Failed Constraints / Test Cases:</strong>
                      <ul style={{ paddingLeft: '1.2rem', marginTop: '0.2rem' }}>
                        {currentEval.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontStyle: 'italic', padding: '1rem 0' }}>
                  Run your code to evaluate. Remember you have exactly 3 attempts per program.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
