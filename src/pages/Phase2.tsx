// TECH EXPERT 2K26 — PHASE 2: PYTHON DEBUGGING CHALLENGE
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CountdownTimer } from '../components/common/CountdownTimer';
import type { Question, PhaseControl, AIResponse } from '../types';
import {
  Code2,
  Play,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export const Phase2: React.FC = () => {
  const { user, profile } = useAuth();

  const [phaseControl, setPhaseControl] = useState<PhaseControl | null>(null);
  const [questionSet, setQuestionSet] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [evaluating, setEvaluating] = useState(false);
  const [evalResults, setEvalResults] = useState<Record<string, AIResponse>>({});
  const [solvedQuestions, setSolvedQuestions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 15 Minutes Phase Deadline Start Time
  const [phaseStartTime] = useState<number>(() => {
    const stored = localStorage.getItem('svce_phase2_start');
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    localStorage.setItem('svce_phase2_start', now.toString());
    return now;
  });

  useEffect(() => {
    async function loadPhase2() {
      try {
        const controls = await api.getPhaseControls();
        const p2 = controls.phase2;
        setPhaseControl(p2);

        if (p2.status !== 'active') {
          setError(`Phase 2 is currently ${p2.status}. The event administrator must activate Phase 2 to allow submissions.`);
          setLoading(false);
          return;
        }

        const set = await api.getParticipantAssignedSet('phase2');
        setQuestionSet(set);
        const qs = set.questions || [];
        setQuestions(qs);

        // Initialize code map with starter code
        const initialMap: Record<string, string> = {};
        qs.forEach((q: Question) => {
          initialMap[q.id] = q.starter_code || '# Write your python code here\n';
        });
        setCodeMap(initialMap);

      } catch (err: any) {
        console.error('Failed to load Phase 2:', err);
        setError(err.message || 'Failed to load assigned questions for Phase 2');
      } finally {
        setLoading(false);
      }
    }
    loadPhase2();
  }, []);

  const currentQ = questions[activeQuestionIndex];

  const handleCodeChange = (val: string | undefined) => {
    if (!currentQ || val === undefined) return;
    setCodeMap(prev => ({ ...prev, [currentQ.id]: val }));
  };

  const handleResetToStarter = () => {
    if (!currentQ) return;
    if (confirm('Reset your code to the initial starter program?')) {
      setCodeMap(prev => ({ ...prev, [currentQ.id]: currentQ.starter_code }));
    }
  };

  const handleRunEvaluation = async () => {
    if (!currentQ || evaluating) return;

    setEvaluating(true);
    const code = codeMap[currentQ.id] || '';

    try {
      const response = await api.submitCodeRun({
        question_id: currentQ.id,
        phase: 'phase2',
        submitted_code: code
      });

      setEvalResults(prev => ({ ...prev, [currentQ.id]: response }));

      if (response.accepted) {
        setSolvedQuestions(prev => ({ ...prev, [currentQ.id]: true }));
      }

    } catch (err: any) {
      console.error('Run evaluation failed:', err);
      setEvalResults(prev => ({
        ...prev,
        [currentQ.id]: {
          status: 'failed',
          predicted_output: `[System Error] ${err.message}`,
          error_type: 'ExecutionError',
          error_message: err.message,
          syntax_valid: false,
          requirements_met: false,
          accepted: false,
          issues: ['Evaluation pipeline failure'],
          explanation: err.message
        }
      }));
    } finally {
      setEvaluating(false);
    }
  };

  const currentEval = currentQ ? evalResults[currentQ.id] : null;

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto', border: '3px solid rgba(168, 85, 247, 0.2)', borderTopColor: 'var(--purple-400)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Phase 2 Debugging Environment & Monaco Editor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-narrow">
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--amber-400)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ marginBottom: '1rem' }}>Phase 2 Notice</h2>
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
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1rem 1.5rem',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--grad-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Code2 size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-purple">PHASE 2</span>
              <strong style={{ color: '#FFFFFF', fontSize: '1.05rem' }}>Python Debugging Challenge</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total Phase Deadline: 15 Minutes • Gemini AI Simulated Evaluation
            </div>
          </div>
        </div>

        {/* Phase-wide 15 Minutes Countdown Timer */}
        <CountdownTimer
          durationSeconds={15 * 60}
          startTimeMs={phaseStartTime}
          label="Phase 2 Total Deadline"
          size="md"
        />
      </div>

      {/* Question Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {questions.map((q, idx) => {
          const isActive = idx === activeQuestionIndex;
          const isSolved = Boolean(solvedQuestions[q.id]);

          return (
            <button
              key={q.id}
              onClick={() => setActiveQuestionIndex(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'rgba(168, 85, 247, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                border: isActive ? '1px solid var(--purple-400)' : '1px solid var(--border-subtle)',
                color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              <FileCode size={16} color={isSolved ? 'var(--emerald-400)' : isActive ? 'var(--purple-400)' : 'var(--text-dim)'} />
              <span>Program {idx + 1}: {q.title}</span>
              {isSolved && <CheckCircle2 size={16} color="var(--emerald-400)" />}
            </button>
          );
        })}
      </div>

      {/* Main Split Layout: Description on Left, Editor on Right */}
      {currentQ && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(350px, 420px) 1fr',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}>
          {/* Left Column: Problem Description & Expected Behavior */}
          <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', maxHeight: '720px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-purple">{currentQ.difficulty?.toUpperCase()}</span>
                <span className="badge badge-emerald">+{currentQ.scoring_points} PTS</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', lineHeight: 1.4 }}>{currentQ.title}</h3>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.4rem' }}>
                Problem Statement & Bug Description
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {currentQ.problem_statement}
              </div>
            </div>

            {/* Rubric / Instructions Hint */}
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'var(--cyan-400)' }}>Evaluation Rules:</strong>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem' }}>
                <li>Code is evaluated mentally by Gemini AI against Python 3 semantics.</li>
                <li>Simulated output is labeled clearly as AI-predicted output.</li>
                <li>Ensure all syntax errors and edge cases are resolved.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Monaco Editor & Output Console */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Editor Container */}
            <div className="glass-card" style={{ overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
              {/* Editor Header Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 1rem',
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                  <Terminal size={14} color="var(--purple-400)" />
                  <span>solution.py</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={handleResetToStarter}
                    className="btn btn-secondary btn-sm"
                    title="Reset to original faulty code"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>

                  <button
                    onClick={handleRunEvaluation}
                    disabled={evaluating}
                    className="btn btn-accent btn-sm"
                    style={{ padding: '0.45rem 1rem' }}
                  >
                    {evaluating ? (
                      <>
                        <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #FFF', borderTopColor: 'transparent', borderRadius: '50%' }} />
                        Simulating Python Execution...
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="#FFFFFF" /> Run & AI Evaluate
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Monaco Editor Instance */}
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
                  <Cpu size={15} color="var(--purple-400)" />
                  <span>Simulated Python Execution Console</span>
                </div>
                {currentEval && (
                  <span className={`badge ${currentEval.accepted ? 'badge-emerald' : 'badge-rose'}`}>
                    {currentEval.accepted ? 'ACCEPTED' : 'REJECTED'}
                  </span>
                )}
              </div>

              {currentEval ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Predicted Output */}
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

                  {/* Explanation & Issues */}
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>AI Analysis:</strong> {currentEval.explanation}
                  </div>

                  {currentEval.issues && currentEval.issues.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--rose-400)' }}>
                      <strong>Identified Issues:</strong>
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
                  Click "Run & AI Evaluate" to simulate execution of your Python code through Gemini AI.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
