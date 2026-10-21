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

        // Waiting Room Redirect
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
          localStorage.removeItem('svce_phase3_start');
          if (session) {
            api.lockSession(session.id, 'Phase 3 was concluded by administrator.').catch(console.error);
          }
        }
      } catch (err) {
        // network error
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [loading, isClosed, session]);

  const currentQ = questions[activeQuestionIndex];
  const currentAttempt = currentQ ? attemptsMap[currentQ.id] : null;
  const currentEval = currentQ ? evalResults[currentQ.id] : undefined;
  const isPaused = phaseControl?.status === 'paused';

  // Winner Verification Logic: Check if all 3 programs are solved
  const solvedCount = Object.values(attemptsMap).filter(a => a.is_solved).length;
  const isAllSolved = questions.length > 0 && solvedCount === questions.length;

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
    if (!currentQ || val === undefined || currentAttempt?.is_locked || currentAttempt?.is_solved) return;
    setCodeMap(prev => ({ ...prev, [currentQ.id]: val }));
  };

  const handleResetToStarter = () => {
    if (!currentQ || currentAttempt?.is_locked || currentAttempt?.is_solved) return;
    if (confirm('Reset your code to starter implementation?')) {
      setCodeMap(prev => ({ ...prev, [currentQ.id]: currentQ.starter_code }));
    }
  };

  const handleRunEvaluation = async () => {
    if (!currentQ || evaluating || currentAttempt?.is_locked || currentAttempt?.is_solved) return;

    const used = currentAttempt?.attempts_used ?? 0;
    if (used >= 3) {
      alert('You have exhausted the maximum 3 evaluation attempts for this program.');
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

      const newUsed = used + 1;
      const isAccepted = Boolean(response.accepted);
      const isNowLocked = !isAccepted && newUsed >= 3;

      setAttemptsMap(prev => ({
        ...prev,
        [currentQ.id]: {
          attempts_used: newUsed,
          is_solved: isAccepted,
          is_locked: isNowLocked
        }
      }));

      setEvalResults(prev => ({ ...prev, [currentQ.id]: response }));

    } catch (err: any) {
      console.error('Phase 3 Run failed:', err);
      setEvalResults(prev => ({
        ...prev,
        [currentQ.id]: {
          status: 'failed',
          predicted_output: `[Execution Error] ${err.message}`,
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
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto', border: '3px solid var(--color-primary-light)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Loading Phase 3 Logic Builder Finals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-narrow">
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--color-warning)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ marginBottom: '1rem', color: 'var(--color-text)' }}>Phase 3 Finals Notice</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
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
      <div className="glass-card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.25rem 1.75rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trophy size={22} color="var(--color-warning)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-amber">PHASE 3 FINALS</span>
              <strong style={{ color: 'var(--color-text)', fontSize: '1.15rem' }}>Python Logic Builder</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
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
            backgroundColor: '#F8FAFC',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              Finals Progress
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isAllSolved ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {solvedCount} / {questions.length} Solved
            </div>
          </div>
        </div>
      </div>

      {/* Forced Closure Banner */}
      {(isClosed || phaseControl?.status === 'closed') && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Lock size={24} style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'inherit' }}>
              Phase 3 Finals Concluded & Submissions Locked
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>
              The event administrator has closed Phase 3. Submissions are finalized, the timer is reset to 00:00, and all editor inputs are locked.
            </p>
          </div>
        </div>
      )}

      {/* Completion Banner */}
      {isAllSolved && (
        <div className="alert alert-success" style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Sparkles size={28} />
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: 'inherit' }}>All 3 Logic Programs Solved!</h3>
              <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Your completion timestamp has been recorded. Check the official leaderboard for winner certification!
              </div>
            </div>
          </div>
          <Link to="/leaderboard" className="btn btn-secondary btn-sm">
            View Live Leaderboard <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Examination Paused Screen */}
      {isPaused ? (
        <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              border: '2px solid var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}
          >
            <Clock size={36} color="var(--color-warning)" />
          </div>
          <span className="badge badge-amber" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
            EXAMINATION PAUSED BY ADMINISTRATOR
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
            Phase 3 Finals & Timer Paused
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto 1.5rem auto', lineHeight: 1.6, fontSize: '0.95rem' }}>
            The administrator has temporarily paused Phase 3 Grand Finals. The algorithmic questions and editor are hidden and the finals timer has stopped. Your code has been safely preserved. Please remain on this screen.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)', fontSize: '0.9rem', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-warning)', animation: 'pulse 1s infinite' }} />
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
                    backgroundColor: isActive ? 'var(--color-primary-light)' : '#FFFFFF',
                    border: isActive ? '1px solid #BFDBFE' : '1px solid var(--color-border)',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {attempt.is_locked ? (
                    <Lock size={16} color="var(--color-danger)" />
                  ) : attempt.is_solved ? (
                    <CheckCircle2 size={16} color="var(--color-success)" />
                  ) : (
                    <FileCode size={16} color="var(--color-primary)" />
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
              gridTemplateColumns: 'minmax(340px, 420px) 1fr',
              gap: '1.25rem',
              alignItems: 'stretch'
            }} className="phase3-grid">
              {/* Left Column: Problem Description & Locked Safeguard */}
              <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', maxHeight: '720px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="badge badge-amber">{currentQ.difficulty?.toUpperCase()}</span>
                    <span className="badge badge-emerald">+{currentQ.scoring_points} PTS</span>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', lineHeight: 1.4, color: 'var(--color-text)', fontWeight: 800 }}>{currentQ.title}</h3>
                </div>

                {/* Permanent Lock Warning */}
                {currentAttempt?.is_locked && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <Lock size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'inherit' }}>
                        Program Permanently Locked
                      </strong>
                      You have exhausted all 3 evaluation attempts for this program. You cannot submit further runs for this challenge. Please switch to another available program.
                    </div>
                  </div>
                )}

                {/* Solved Success Banner */}
                {currentAttempt?.is_solved && (
                  <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <CheckCircle2 size={20} />
                    <div>
                      <strong>Challenge Accepted!</strong> Program is fully solved and points awarded.
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    Problem Statement & Specifications
                  </div>
                  <div style={{ fontSize: '0.925rem', color: 'var(--color-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {currentQ.problem_statement}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.825rem',
                  color: 'var(--color-text-secondary)',
                  marginTop: 'auto'
                }}>
                  <strong style={{ color: 'var(--color-warning)' }}>Phase 3 Attempt Policy:</strong>
                  <p style={{ marginTop: '0.3rem', lineHeight: 1.5, margin: 0 }}>
                    Every valid "Run Attempt" click consumes 1 attempt. After 3 unsuccessful attempts, this program is permanently locked on the server.
                  </p>
                </div>
              </div>

              {/* Right Column: Editor & AI Console */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="glass-card" style={{ overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  {/* Header Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 1rem',
                    backgroundColor: '#F8FAFC',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text)' }}>
                      <Terminal size={15} color="var(--color-primary)" />
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
                            <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%' }} />
                            Evaluating Logic...
                          </>
                        ) : (
                          <>
                            <Play size={14} /> Run Attempt ({(currentAttempt?.attempts_used || 0) + 1}/3)
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
                      theme="vs"
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
                        fontFamily: "'Fira Code', Consolas, monospace"
                      }}
                    />
                  </div>
                </div>

                {/* AI Simulated Output Console */}
                <div className="glass-card" style={{ padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                      <Cpu size={15} color="var(--color-primary)" />
                      <span>Execution & Verdict Console</span>
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
                        backgroundColor: '#F8FAFC',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.875rem',
                        color: currentEval.accepted ? 'var(--color-success)' : 'var(--color-danger)',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '160px',
                        overflowY: 'auto',
                        border: '1px solid var(--color-border)'
                      }}>
                        {currentEval.predicted_output || 'No output produced'}
                      </div>

                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        <strong style={{ color: 'var(--color-text)' }}>Evaluation Verdict:</strong> {currentEval.explanation}
                      </div>

                      {currentEval.issues && currentEval.issues.length > 0 && (
                        <div style={{ fontSize: '0.825rem', color: 'var(--color-danger)' }}>
                          <strong>Failed Constraints / Test Cases:</strong>
                          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.2rem' }}>
                            {currentEval.issues.map((issue: string, i: number) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontStyle: 'italic', padding: '0.75rem 0' }}>
                      Run your code to evaluate. Remember you have exactly 3 attempts per program before permanent lock.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Responsive Grid Breakpoint Helper */}
      <style>{`
        @media (max-width: 960px) {
          .phase3-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
