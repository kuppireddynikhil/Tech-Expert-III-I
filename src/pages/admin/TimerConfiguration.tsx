// TECH EXPERT 2K26 — CUSTOM TIMER CONFIGURATION & INHERITANCE MATRIX
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Question, QuestionSet, PhaseControl } from '../../types';
import {
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  ArrowRight,
  Database
} from 'lucide-react';

export const TimerConfiguration: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [phaseControls, setPhaseControls] = useState<Record<string, PhaseControl> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<string>('phase1');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qs, sets, phases] = await Promise.all([
        api.getQuestions(),
        api.getQuestionSets(),
        api.getPhaseControls()
      ]);
      setQuestions(qs);
      setQuestionSets(sets);
      setPhaseControls(phases);
    } catch (err) {
      console.error('Failed to load timer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateQuestionTimer = async (qId: string, newSeconds: number | null) => {
    setUpdatingId(qId);
    try {
      await api.updateQuestion(qId, { custom_timer: newSeconds });
      await loadData();
    } catch (err: any) {
      alert(`Failed to update timer: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateSetDefaultTimer = async (setId: string, newSeconds: number) => {
    setUpdatingId(setId);
    try {
      await api.updateQuestionSet(setId, { default_timer: newSeconds });
      await loadData();
    } catch (err: any) {
      alert(`Failed to update set timer: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || !phaseControls) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto', border: '3px solid rgba(0, 242, 254, 0.2)', borderTopColor: 'var(--cyan-400)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Timer Hierarchy & Inheritance Tree...</p>
      </div>
    );
  }

  const phaseFilteredQuestions = questions.filter(q => q.phase === selectedPhase);
  const phaseFilteredSets = questionSets.filter(s => s.phase === selectedPhase);
  const currentPhaseCtrl = phaseControls[selectedPhase];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>
          Timing Governance
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Custom Timer Engine</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Inspect and configure authoritative timers across Question-level, Question-Set level, and Phase-level inheritance.
        </div>
      </div>

      {/* Inheritance Rules Infographic */}
      <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyan-400)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Timer Precedence Hierarchy
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem'
        }}>
          <div style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(0, 242, 254, 0.1)', border: '1px solid var(--cyan-400)', borderRadius: 'var(--radius-sm)', color: '#FFFFFF' }}>
            1. Question Override (Highest)
          </div>
          <ArrowRight size={16} color="var(--text-dim)" />
          <div style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid var(--purple-400)', borderRadius: 'var(--radius-sm)', color: '#FFFFFF' }}>
            2. Question Set Default
          </div>
          <ArrowRight size={16} color="var(--text-dim)" />
          <div style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#FFFFFF' }}>
            3. Phase Global Default
          </div>
        </div>
      </div>

      {/* Phase Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {(['phase1', 'phase2', 'phase3'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPhase(p)}
            className={`btn ${selectedPhase === p ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            {p === 'phase1' && 'Phase 1: Quick Quiz'}
            {p === 'phase2' && 'Phase 2: Debugging'}
            {p === 'phase3' && 'Phase 3: Logic Builder'}
          </button>
        ))}
      </div>

      {/* Question Sets Default Timers for Selected Phase */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          Question Sets Default Timers ({selectedPhase.toUpperCase()})
        </h3>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Question Set</th>
                <th>Phase Default Policy</th>
                <th>Set Default Timer</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {phaseFilteredSets.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong style={{ color: '#FFFFFF' }}>{s.set_name}</strong>
                  </td>
                  <td>
                    <span className="badge badge-purple">{s.timer_policy}</span>
                  </td>
                  <td style={{ width: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="number"
                        defaultValue={s.default_timer}
                        id={`set-timer-${s.id}`}
                        className="form-input"
                        style={{ width: '90px', padding: '0.4rem 0.6rem' }}
                      />
                      <span>seconds</span>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        const el = document.getElementById(`set-timer-${s.id}`) as HTMLInputElement;
                        if (el) handleUpdateSetDefaultTimer(s.id, parseInt(el.value, 10) || 15);
                      }}
                      disabled={updatingId === s.id}
                      className="btn btn-secondary btn-sm"
                    >
                      <Save size={13} /> Save Set Timer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Question Timers Table */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          Individual Question Timer Overrides ({selectedPhase.toUpperCase()})
        </h3>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Current Effective Timer</th>
                <th>Timer Override (s)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {phaseFilteredQuestions.map((q) => {
                const effective = q.custom_timer ?? currentPhaseCtrl.default_question_timer;
                const isOverridden = q.custom_timer !== null && q.custom_timer !== undefined;

                return (
                  <tr key={q.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{q.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Type: {q.question_type.toUpperCase()} • Difficulty: {q.difficulty}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${isOverridden ? 'badge-amber' : 'badge-cyan'}`}>
                        {effective}s {isOverridden ? '(Overridden)' : '(Inherited)'}
                      </span>
                    </td>
                    <td style={{ width: '180px' }}>
                      <input
                        type="number"
                        placeholder="Inherit"
                        defaultValue={q.custom_timer ?? ''}
                        id={`q-timer-${q.id}`}
                        className="form-input"
                        style={{ width: '100px', padding: '0.4rem 0.6rem' }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => {
                            const el = document.getElementById(`q-timer-${q.id}`) as HTMLInputElement;
                            const val = el.value.trim() === '' ? null : parseInt(el.value, 10);
                            handleUpdateQuestionTimer(q.id, val);
                          }}
                          disabled={updatingId === q.id}
                          className="btn btn-primary btn-sm"
                        >
                          <Save size={13} /> Apply
                        </button>
                        {isOverridden && (
                          <button
                            onClick={() => handleUpdateQuestionTimer(q.id, null)}
                            disabled={updatingId === q.id}
                            className="btn btn-secondary btn-sm"
                            title="Reset to inherit"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
