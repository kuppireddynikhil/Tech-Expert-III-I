// TECH EXPERT 2K26 — QUESTION SET MANAGEMENT & ASSIGNMENTS
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { QuestionSet, Question, QuestionSetAssignment, PhaseId, SectionType, AcademicYearType } from '../../types';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Users,
  Share2
} from 'lucide-react';

export const QuestionSetManagement: React.FC = () => {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [assignments, setAssignments] = useState<QuestionSetAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [assignModalSet, setAssignModalSet] = useState<QuestionSet | null>(null);
  const [newSetName, setNewSetName] = useState('');
  const [newSetPhase, setNewSetPhase] = useState<PhaseId>('phase1');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [newSetTimer, setNewSetTimer] = useState<number>(15);
  const [selectedQuestionToAdd, setSelectedQuestionToAdd] = useState<Record<string, string>>({});

  // Assignment Modal Inputs
  const [targetType, setTargetType] = useState<'all' | 'section' | 'academic_year' | 'section_year' | 'participant'>('all');
  const [targetSection, setTargetSection] = useState<SectionType>('A');
  const [targetYear, setTargetYear] = useState<AcademicYearType>('I');
  const [targetParticipantId, setTargetParticipantId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSets, qs, currentAssigns] = await Promise.all([
        api.getQuestionSets(),
        api.getQuestions(),
        api.getAssignments()
      ]);
      setSets(allSets);
      setAllQuestions(qs);
      setAssignments(currentAssigns);
    } catch (err) {
      console.error('Failed to load sets and assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetName.trim()) return;

    try {
      await api.createQuestionSet({
        set_name: newSetName.trim(),
        phase: newSetPhase,
        description: newSetDescription.trim(),
        is_published: true,
        is_archived: false,
        default_timer: Number(newSetTimer),
        timer_policy: newSetPhase === 'phase1' ? 'per_question' : 'total_phase'
      });

      setNewSetName('');
      setNewSetDescription('');
      await loadData();
    } catch (err: any) {
      alert(`Failed to create set: ${err.message}`);
    }
  };

  const handleAssignSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalSet) return;

    let targetValue = 'all';
    if (targetType === 'section') targetValue = targetSection;
    else if (targetType === 'academic_year') targetValue = targetYear;
    else if (targetType === 'section_year') targetValue = `${targetSection}-${targetYear}`;
    else if (targetType === 'participant') {
      if (!targetParticipantId.trim()) {
        alert('Please enter a participant UUID');
        return;
      }
      targetValue = targetParticipantId.trim();
    }

    if (confirm(`Confirm assigning set '${assignModalSet.set_name}' to ${targetType.toUpperCase()}: ${targetValue}?`)) {
      try {
        await api.assignQuestionSet(assignModalSet.id, targetType, targetValue);
        setAssignModalSet(null);
        await loadData();
      } catch (err: any) {
        alert(`Failed to assign set: ${err.message}`);
      }
    }
  };

  const handleTogglePublish = async (s: QuestionSet) => {
    try {
      await api.updateQuestionSet(s.id, { is_published: !s.is_published });
      await loadData();
    } catch (err: any) {
      alert(`Error toggling publication: ${err.message}`);
    }
  };

  const handleAddItemToSet = async (setId: string, questionId: string) => {
    const targetSet = sets.find(s => s.id === setId);
    if (!targetSet) return;

    const existingItems = targetSet.items || [];
    if (existingItems.some(i => i.question_id === questionId)) {
      alert('This question is already in the set.');
      return;
    }

    const newItems = [
      ...existingItems.map(i => ({ question_id: i.question_id, display_order: i.display_order, timer_override: i.timer_override })),
      { question_id: questionId, display_order: existingItems.length + 1, timer_override: null }
    ];

    try {
      await api.updateQuestionSetItems(setId, newItems);
      await loadData();
    } catch (err: any) {
      alert(`Error adding question to set: ${err.message}`);
    }
  };

  const handleRemoveItemFromSet = async (setId: string, questionId: string) => {
    const targetSet = sets.find(s => s.id === setId);
    if (!targetSet) return;

    const remaining = (targetSet.items || [])
      .filter(i => i.question_id !== questionId)
      .map((item, idx) => ({
        question_id: item.question_id,
        display_order: idx + 1,
        timer_override: item.timer_override
      }));

    try {
      await api.updateQuestionSetItems(setId, remaining);
      await loadData();
    } catch (err: any) {
      alert(`Error removing question: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>
            Multi-Set Governance
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Question Set Management</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Assemble question sets, reorder items, assign default timers, and release to Sections A–E or Years I–III.
          </div>
        </div>
      </div>

      {/* Create New Set Form Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} color="var(--cyan-400)" />
          Create New Question Set
        </h3>

        <form onSubmit={handleCreateSet} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Set Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Phase 1 — Set B (Alternate)"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Phase</label>
            <select
              className="form-select"
              value={newSetPhase}
              onChange={(e) => setNewSetPhase(e.target.value as PhaseId)}
            >
              <option value="phase1">Phase 1: Quick Quiz</option>
              <option value="phase2">Phase 2: Debugging Challenge</option>
              <option value="phase3">Phase 3: Logic Builder</option>
            </select>
          </div>

          <div>
            <label className="form-label">Default Timer (s)</label>
            <input
              type="number"
              className="form-input"
              value={newSetTimer}
              onChange={(e) => setNewSetTimer(parseInt(e.target.value, 10) || 15)}
              required
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="Optional notes or target group"
              value={newSetDescription}
              onChange={(e) => setNewSetDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
            <Plus size={16} /> Create Set
          </button>
        </form>
      </div>

      {/* Question Sets List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {sets.map((set) => {
          let phaseBadge = 'badge-cyan';
          if (set.phase === 'phase2') phaseBadge = 'badge-purple';
          if (set.phase === 'phase3') phaseBadge = 'badge-rose';

          const availableForThisPhase = allQuestions.filter(q => q.phase === set.phase && !q.is_archived);
          const currentItemIds = new Set((set.items || []).map(i => i.question_id));
          const unassignedQuestions = availableForThisPhase.filter(q => !currentItemIds.has(q.id));

          return (
            <div key={set.id} className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className={`badge ${phaseBadge}`}>{set.phase.toUpperCase()}</span>
                    <h3 style={{ fontSize: '1.35rem' }}>{set.set_name}</h3>
                    <button
                      onClick={() => handleTogglePublish(set)}
                      className={`badge ${set.is_published ? 'badge-emerald' : 'badge-amber'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {set.is_published ? 'PUBLISHED' : 'DRAFT'}
                    </button>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    {set.description || 'No description provided'} • Default Timer: <strong>{set.default_timer}s</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setAssignModalSet(set)}
                    className="btn btn-primary btn-sm"
                  >
                    <Share2 size={14} /> Assign to Groups / Sections
                  </button>
                </div>
              </div>

              {/* Items in this set */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.6rem' }}>
                  Assigned Questions in this Set ({set.items?.length || 0})
                </div>

                {set.items && set.items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {set.items.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 1rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.875rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)', fontWeight: 700 }}>
                            #{idx + 1}
                          </span>
                          <span style={{ fontWeight: 600, color: '#FFFFFF' }}>
                            {item.question?.title || 'Question item'}
                          </span>
                          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                            {item.question?.question_type?.toUpperCase()}
                          </span>
                          {item.timer_override && (
                            <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                              Override: {item.timer_override}s
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveItemFromSet(set.id, item.question_id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                          title="Remove from Set"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.75rem 0' }}>
                    No questions added to this set yet. Add questions from the pool below.
                  </div>
                )}
              </div>

              {/* Add from available questions pool */}
              {unassignedQuestions.length > 0 && (
                <div style={{
                  backgroundColor: 'rgba(10, 15, 29, 0.6)',
                  border: '1px dashed var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Add questions from pool ({unassignedQuestions.length} available):
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      className="form-input"
                      style={{ minWidth: '260px', maxWidth: '420px', fontSize: '0.825rem', padding: '0.4rem 0.6rem' }}
                      value={selectedQuestionToAdd[set.id] || ''}
                      onChange={(e) => setSelectedQuestionToAdd(prev => ({ ...prev, [set.id]: e.target.value }))}
                    >
                      <option value="">-- Select Question to Add --</option>
                      {unassignedQuestions.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.title} ({q.difficulty} • {q.scoring_points} pts)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const qId = selectedQuestionToAdd[set.id];
                        if (qId) {
                          handleAddItemToSet(set.id, qId);
                          setSelectedQuestionToAdd(prev => ({ ...prev, [set.id]: '' }));
                        }
                      }}
                      disabled={!selectedQuestionToAdd[set.id]}
                      className="btn btn-secondary btn-sm"
                    >
                      <Plus size={14} /> Add Selected Question
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Group Assignments Table */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Active Group & Section Assignments</h3>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Target Scope</th>
                <th>Target Value</th>
                <th>Assigned Set</th>
                <th>Status</th>
                <th>Assigned At</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                    No explicit set assignments created. Default set rules will apply.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="badge badge-purple">{a.target_type.toUpperCase()}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--cyan-400)' }}>{a.target_value}</strong>
                    </td>
                    <td style={{ fontWeight: 600, color: '#FFFFFF' }}>
                      {a.set_name || 'Question Set'}
                    </td>
                    <td>
                      <span className="badge badge-emerald">ACTIVE</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {assignModalSet && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card-glow" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
              Assign Set: {assignModalSet.set_name}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Assign this question set to Sections A–E, Academic Years I–III, or specific finalists.
            </p>

            <form onSubmit={handleAssignSet} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Assignment Target Scope</label>
                <select
                  className="form-select"
                  value={targetType}
                  onChange={(e: any) => setTargetType(e.target.value)}
                >
                  <option value="all">All Eligible Participants</option>
                  <option value="section">Specific Section (A, B, C, D, E)</option>
                  <option value="academic_year">Specific Academic Year (I, II, III)</option>
                  <option value="section_year">Section + Year Combination</option>
                  <option value="participant">Specific Participant ID</option>
                </select>
              </div>

              {(targetType === 'section' || targetType === 'section_year') && (
                <div>
                  <label className="form-label">Select Section (Strict A–E)</label>
                  <select
                    className="form-select"
                    value={targetSection}
                    onChange={(e: any) => setTargetSection(e.target.value)}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                    <option value="E">Section E</option>
                  </select>
                </div>
              )}

              {(targetType === 'academic_year' || targetType === 'section_year') && (
                <div>
                  <label className="form-label">Select Academic Year (Strict I–III)</label>
                  <select
                    className="form-select"
                    value={targetYear}
                    onChange={(e: any) => setTargetYear(e.target.value)}
                  >
                    <option value="I">Year I</option>
                    <option value="II">Year II</option>
                    <option value="III">Year III</option>
                  </select>
                </div>
              )}

              {targetType === 'participant' && (
                <div>
                  <label className="form-label">Participant User ID (UUID)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter participant UUID"
                    value={targetParticipantId}
                    onChange={(e) => setTargetParticipantId(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setAssignModalSet(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
