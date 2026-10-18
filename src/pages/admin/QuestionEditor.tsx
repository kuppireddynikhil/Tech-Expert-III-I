// TECH EXPERT 2K26 — QUESTION EDITOR (CREATE & EDIT)
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { api } from '../../services/api';
import type { Question, PhaseId, QuestionType, QuestionDifficulty, QuestionChoice } from '../../types';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Code2,
  HelpCircle,
  FileCode,
  Lock,
  Clock,
  Sparkles
} from 'lucide-react';

export const QuestionEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [phase, setPhase] = useState<PhaseId>('phase1');
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [choices, setChoices] = useState<QuestionChoice[]>([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('A');
  const [starterCode, setStarterCode] = useState('');
  const [referenceSolution, setReferenceSolution] = useState('');
  const [rubricText, setRubricText] = useState('{\n  "test_cases": [],\n  "rubric": ""\n}');
  const [scoringPoints, setScoringPoints] = useState(10);
  const [customTimer, setCustomTimer] = useState<number | ''>('');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
  const [tagsInput, setTagsInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
      api.getQuestionById(id).then((q) => {
        if (q) {
          setPhase(q.phase);
          setQuestionType(q.question_type);
          setTitle(q.title);
          setProblemStatement(q.problem_statement);
          if (q.choices && q.choices.length > 0) setChoices(q.choices);
          if (q.private_correct_answers && q.private_correct_answers.length > 0) {
            setCorrectAnswer(q.private_correct_answers[0]);
          }
          setStarterCode(q.starter_code || '');
          setReferenceSolution(q.private_reference_solution || '');
          if (q.private_evaluation_rubric) {
            setRubricText(JSON.stringify(q.private_evaluation_rubric, null, 2));
          }
          setScoringPoints(q.scoring_points || 10);
          setCustomTimer(q.custom_timer ?? '');
          setDifficulty(q.difficulty || 'medium');
          setTagsInput(q.tags?.join(', ') || '');
          setIsPublished(q.is_published);
        }
        setLoading(false);
      }).catch(err => {
        console.error('Failed to load question for editing:', err);
        setError('Failed to load question.');
        setLoading(false);
      });
    }
  }, [id, isEditing]);

  const handleChoiceChange = (idx: number, text: string) => {
    const updated = [...choices];
    updated[idx].text = text;
    setChoices(updated);
  };

  const handleAddChoice = () => {
    const nextLetter = String.fromCharCode(65 + choices.length);
    setChoices([...choices, { id: nextLetter, text: '' }]);
  };

  const handleRemoveChoice = (idx: number) => {
    if (choices.length <= 2) {
      alert('A multiple-choice question must have at least 2 choices.');
      return;
    }
    const updated = choices.filter((_, i) => i !== idx);
    setChoices(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !problemStatement.trim()) {
      setError('Title and Problem Statement are required.');
      return;
    }

    let parsedRubric = {};
    if (questionType !== 'mcq' && rubricText.trim()) {
      try {
        parsedRubric = JSON.parse(rubricText);
      } catch (err) {
        setError('Evaluation Rubric must be a valid JSON object.');
        return;
      }
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const payload = {
      phase,
      question_type: questionType,
      title: title.trim(),
      problem_statement: problemStatement.trim(),
      choices: questionType === 'mcq' ? choices : [],
      private_correct_answers: questionType === 'mcq' ? [correctAnswer] : [],
      starter_code: questionType !== 'mcq' ? starterCode : '',
      private_reference_solution: questionType !== 'mcq' ? referenceSolution : '',
      private_evaluation_rubric: parsedRubric,
      scoring_points: Number(scoringPoints),
      custom_timer: customTimer !== '' ? Number(customTimer) : null,
      difficulty,
      tags,
      is_published: isPublished,
      is_archived: false
    };

    setSaving(true);
    try {
      if (isEditing && id) {
        await api.updateQuestion(id, payload);
      } else {
        await api.createQuestion(payload);
      }
      navigate('/admin/questions');
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto', border: '3px solid rgba(0, 242, 254, 0.2)', borderTopColor: 'var(--cyan-400)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading question configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/admin/questions" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back to Bank
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {isEditing ? 'Edit Competition Question' : 'Create New Competition Question'}
          </h1>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Phase, Type & Difficulty Selection Row */}
        <div className="grid-3">
          <div>
            <label className="form-label">Competition Phase</label>
            <select
              className="form-select"
              value={phase}
              onChange={(e) => {
                const p = e.target.value as PhaseId;
                setPhase(p);
                if (p === 'phase1') setQuestionType('mcq');
                else if (p === 'phase2') setQuestionType('debug');
                else if (p === 'phase3') setQuestionType('logic');
              }}
            >
              <option value="phase1">Phase 1: Quick Quiz</option>
              <option value="phase2">Phase 2: Debugging Challenge</option>
              <option value="phase3">Phase 3: Logic Builder</option>
            </select>
          </div>

          <div>
            <label className="form-label">Question Type</label>
            <select
              className="form-select"
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
            >
              <option value="mcq">MCQ (Multiple Choice)</option>
              <option value="debug">Debugging Program</option>
              <option value="logic">Incomplete-Logic Program</option>
            </select>
          </div>

          <div>
            <label className="form-label">Difficulty Level</label>
            <select
              className="form-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Title */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Question Title</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. List Comprehension Key Mutation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Problem Statement */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Problem Statement / Question Prompt</label>
          <textarea
            className="form-textarea"
            rows={5}
            placeholder="Enter the problem statement, constraints, and test scenarios..."
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            required
          />
        </div>

        {/* Conditional MCQ Editor */}
        {questionType === 'mcq' && (
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.25)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--cyan-400)' }}>
                Multiple Choice Options
              </div>
              <button type="button" onClick={handleAddChoice} className="btn btn-secondary btn-sm">
                <Plus size={13} /> Add Choice
              </button>
            </div>

            {choices.map((c, idx) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}>
                  {c.id}
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Choice ${c.id} text...`}
                  value={c.text}
                  onChange={(e) => handleChoiceChange(idx, e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveChoice(idx)}
                  className="btn btn-danger btn-sm"
                  title="Remove Choice"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {/* Correct Answer Selection */}
            <div style={{ marginTop: '0.5rem' }}>
              <label className="form-label">
                <span>Private Correct Answer</span>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Protected by RLS</span>
              </label>
              <select
                className="form-select"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                style={{ maxWidth: '240px' }}
              >
                {choices.map((c) => (
                  <option key={c.id} value={c.id}>
                    Option {c.id} is correct
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Conditional Coding Editor (Debugging / Logic) */}
        {questionType !== 'mcq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Starter Code Editor */}
            <div>
              <label className="form-label">
                <span>Starter Code (Participant Starting Code)</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Monaco Editor</span>
              </label>
              <div style={{ height: '240px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  theme="vs-dark"
                  value={starterCode}
                  onChange={(val) => setStarterCode(val || '')}
                  options={{ minimap: { enabled: false }, fontSize: 13 }}
                />
              </div>
            </div>

            {/* Reference Solution Editor (PRIVATE) */}
            <div>
              <label className="form-label">
                <span>Private Reference Solution (Hidden from Participants)</span>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>RLS Protected</span>
              </label>
              <div style={{ height: '240px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  theme="vs-dark"
                  value={referenceSolution}
                  onChange={(val) => setReferenceSolution(val || '')}
                  options={{ minimap: { enabled: false }, fontSize: 13 }}
                />
              </div>
            </div>

            {/* Evaluation Rubric / Test Cases */}
            <div>
              <label className="form-label">
                <span>Private Evaluation Rubric (JSON Format)</span>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Used by Gemini AI</span>
              </label>
              <textarea
                className="form-textarea"
                rows={5}
                value={rubricText}
                onChange={(e) => setRubricText(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        )}

        {/* Points, Custom Timer & Tags Row */}
        <div className="grid-3">
          <div>
            <label className="form-label">Scoring Points</label>
            <input
              type="number"
              className="form-input"
              value={scoringPoints}
              onChange={(e) => setScoringPoints(parseInt(e.target.value, 10) || 0)}
              required
            />
          </div>

          <div>
            <label className="form-label">
              <span>Custom Timer (Seconds)</span>
              <span className="form-hint">Optional override</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 15 (Leave blank to inherit)"
              value={customTimer}
              onChange={(e) => setCustomTimer(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            />
          </div>

          <div>
            <label className="form-label">Tags (Comma-separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. basics, syntax, strings"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
        </div>

        {/* Publication Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem' }}>
          <input
            type="checkbox"
            id="is-published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--cyan-400)', cursor: 'pointer' }}
          />
          <label htmlFor="is-published" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
            Publish question immediately (Available for question set assignments)
          </label>
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <Link to="/admin/questions" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
            <Save size={16} />
            {saving ? 'Saving to Database...' : isEditing ? 'Update Question' : 'Create Question'}
          </button>
        </div>
      </form>
    </div>
  );
};
