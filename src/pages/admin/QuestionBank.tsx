// TECH EXPERT 2K26 — CENTRAL QUESTION BANK
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { Question } from '../../types';
import {
  Plus,
  Search,
  Copy,
  Archive,
  Edit3,
  Eye,
  X
} from 'lucide-react';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await api.getQuestions();
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicateQuestion(id);
      await loadQuestions();
    } catch (err: any) {
      alert(`Failed to duplicate question: ${err.message}`);
    }
  };

  const handleArchive = async (id: string, title: string) => {
    if (confirm(`Archive question '${title}'? This will preserve all historical submissions while hiding it from future sets.`)) {
      try {
        await api.archiveQuestion(id, 'Admin manual archival from Question Bank');
        await loadQuestions();
      } catch (err: any) {
        alert(`Failed to archive question: ${err.message}`);
      }
    }
  };

  const handleTogglePublish = async (q: Question) => {
    try {
      await api.updateQuestion(q.id, { is_published: !q.is_published });
      await loadQuestions();
    } catch (err: any) {
      alert(`Failed to update publication status: ${err.message}`);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = 
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.problem_statement.toLowerCase().includes(search.toLowerCase()) ||
      q.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

    const matchesPhase = selectedPhase === 'ALL' || q.phase === selectedPhase;
    const matchesType = selectedType === 'ALL' || q.question_type === selectedType;

    return matchesSearch && matchesPhase && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
            Central Repository
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)' }}>Question Bank</h1>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Manage questions, answer choices, faulty programs, rubrics, and custom timers.
          </div>
        </div>

        <Link to="/admin/questions/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={16} /> Create New Question
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search questions by title, keyword, or #tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Phase Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Phase:</span>
          <select
            className="form-select"
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            style={{ width: '130px', padding: '0.55rem 0.75rem', fontSize: '0.875rem' }}
          >
            <option value="ALL">All Phases</option>
            <option value="phase1">Phase 1 (Quiz)</option>
            <option value="phase2">Phase 2 (Debug)</option>
            <option value="phase3">Phase 3 (Logic)</option>
          </select>
        </div>

        {/* Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Type:</span>
          <select
            className="form-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ width: '130px', padding: '0.55rem 0.75rem', fontSize: '0.875rem' }}
          >
            <option value="ALL">All Types</option>
            <option value="mcq">MCQ</option>
            <option value="debug">Debugging</option>
            <option value="logic">Logic Builder</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Title / Problem</th>
              <th>Phase</th>
              <th>Type</th>
              <th>Timer</th>
              <th>Points</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                  Loading question bank...
                </td>
              </tr>
            ) : filteredQuestions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                  No questions match your current filters.
                </td>
              </tr>
            ) : (
              filteredQuestions.map((q) => {
                let phaseBadge = 'badge-primary';
                if (q.phase === 'phase2') phaseBadge = 'badge-secondary';
                if (q.phase === 'phase3') phaseBadge = 'badge-primary';

                return (
                  <tr key={q.id}>
                    <td style={{ maxWidth: '360px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{q.title}</div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {q.problem_statement}
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                        {q.tags?.map((tag, i) => (
                          <span key={i} style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${phaseBadge}`}>{q.phase.toUpperCase()}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                        {q.question_type}
                      </span>
                    </td>
                    <td>
                      {q.custom_timer ? (
                        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{q.custom_timer}s</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>Inherited</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{q.scoring_points} pts</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleTogglePublish(q)}
                        className={`badge ${q.is_published ? 'badge-success' : 'badge-warning'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle publication status"
                      >
                        {q.is_published ? 'PUBLISHED' : 'DRAFT'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => setPreviewQuestion(q)}
                          className="btn btn-secondary btn-sm"
                          title="Preview Participant View"
                        >
                          <Eye size={13} />
                        </button>
                        <Link
                          to={`/admin/questions/edit/${q.id}`}
                          className="btn btn-secondary btn-sm"
                          title="Edit Question"
                        >
                          <Edit3 size={13} />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(q.id)}
                          className="btn btn-secondary btn-sm"
                          title="Duplicate Question"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => handleArchive(q.id, q.title)}
                          className="btn btn-danger btn-sm"
                          title="Archive (Soft Delete preserving historical attempts)"
                        >
                          <Archive size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Participant Preview Modal */}
      {previewQuestion && (
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
          <div className="card" style={{ maxWidth: '650px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '2rem', boxShadow: 'var(--shadow-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.35rem' }}>
                  PARTICIPANT-FACING PREVIEW
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>{previewQuestion.title}</h3>
              </div>
              <button onClick={() => setPreviewQuestion(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem', whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
              {previewQuestion.problem_statement}
            </div>

            {previewQuestion.question_type === 'mcq' && previewQuestion.choices && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {previewQuestion.choices.map((c) => (
                  <div key={c.id} style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--color-surface-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    color: 'var(--color-text)'
                  }}>
                    <strong style={{ color: 'var(--color-primary)' }}>{c.id}.</strong> {c.text}
                  </div>
                ))}
              </div>
            )}

            {previewQuestion.starter_code && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Starter Code
                </div>
                <pre style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                  overflowX: 'auto'
                }}>
                  {previewQuestion.starter_code}
                </pre>
              </div>
            )}

            <div style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              color: 'var(--color-text-secondary)'
            }}>
              <span>Points: <strong style={{ color: 'var(--color-primary)' }}>{previewQuestion.scoring_points} pts</strong></span>
              <span>Timer: <strong style={{ color: 'var(--color-text)' }}>{previewQuestion.custom_timer ? `${previewQuestion.custom_timer}s` : 'Inherited from set'}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
