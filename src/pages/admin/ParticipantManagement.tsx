// TECH EXPERT 2K26 — PARTICIPANT MANAGEMENT
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Profile, SectionType, AcademicYearType, RegistrationStatus, CompetitionSession } from '../../types';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Shield,
  Clock,
  Layers,
  Play,
  XCircle,
  HelpCircle
} from 'lucide-react';

export const ParticipantManagement: React.FC = () => {
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [sessions, setSessions] = useState<CompetitionSession[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Selected session for Re-entry Decision Modal
  const [reentryTarget, setReentryTarget] = useState<{ user: Profile; session: CompetitionSession } | null>(null);
  const [reentryActionReason, setReentryActionReason] = useState('');
  const [processingReentry, setProcessingReentry] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, sess] = await Promise.all([
        api.getParticipants(),
        api.getCompetitionSessions()
      ]);
      setParticipants(users);
      setSessions(sess);
    } catch (err) {
      console.error('Failed to load participants and sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (user: Profile, newStatus: RegistrationStatus) => {
    const reason = prompt(`Enter administrative reason for setting ${user.full_name} to ${newStatus.toUpperCase()}:`, 'Event compliance review');
    if (!reason) return;

    try {
      await api.updateParticipantStatus(user.user_id, newStatus, reason);
      await loadData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleReentryDecision = async (mode: 'resume' | 'fresh' | 'reject') => {
    if (!reentryTarget) return;

    setProcessingReentry(true);
    try {
      const defaultReason = mode === 'resume' 
        ? 'Admin approved resumption of existing session'
        : mode === 'fresh'
          ? 'Admin authorized fresh exam attempt'
          : 'Admin rejected re-entry request';

      const reasonToLog = reentryActionReason.trim() || defaultReason;

      if (mode === 'reject') {
        await api.rejectReentry(reentryTarget.session.id, reasonToLog);
      } else {
        await api.approveReentry(reentryTarget.session.id, mode, reasonToLog);
      }

      setReentryTarget(null);
      setReentryActionReason('');
      await loadData();
    } catch (err: any) {
      alert(`Failed to execute re-entry decision: ${err.message}`);
    } finally {
      setProcessingReentry(false);
    }
  };

  const [activatingAll, setActivatingAll] = useState(false);

  const handleActivateAll = async () => {
    const targets = filtered.filter(p => p.registration_status !== 'active' && p.registration_status !== 'disqualified');
    if (targets.length === 0) {
      alert('No participants to activate. (Disqualified participants are never activated in bulk.)');
      return;
    }
    if (!confirm(`Activate ${targets.length} participant(s) currently shown in the list? Disqualified participants are skipped.`)) return;

    setActivatingAll(true);
    try {
      const count = await api.activateParticipants(targets.map(t => t.user_id), 'Bulk activation by administrator');
      alert(`Activated ${count} participant(s).`);
      await loadData();
    } catch (err: any) {
      alert(`Failed to activate participants: ${err.message}`);
    } finally {
      setActivatingAll(false);
    }
  };

  const pendingReentries = sessions.filter(s => s.reentry_status === 'requested');

  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.college_id && p.college_id.toLowerCase().includes(search.toLowerCase()));

    const matchesSec = selectedSection === 'ALL' || p.section === selectedSection;
    const matchesYr = selectedYear === 'ALL' || p.academic_year === selectedYear;
    const matchesSt = selectedStatus === 'ALL' || p.registration_status === selectedStatus;

    return matchesSearch && matchesSec && matchesYr && matchesSt;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>
          User Administration
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Participant Management</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Inspect participants across Sections A–E and Years I–III, govern account status, and authorize exam re-entry.
        </div>
      </div>

      {/* Pending Re-entry Requests Alert Banner (Modification A) */}
      {pendingReentries.length > 0 && (
        <div className="glass-card" style={{
          padding: '1.25rem 1.5rem',
          border: '1px solid var(--amber-400)',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={20} color="var(--amber-400)" />
              <strong style={{ color: '#FFFFFF', fontSize: '1rem' }}>
                Pending Exam Re-Entry Requests ({pendingReentries.length})
              </strong>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Requires administrator decision: Resume Session vs Authorize Fresh Attempt
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingReentries.map((sess) => {
              const participant = participants.find(p => p.user_id === sess.participant_id);
              if (!participant) return null;

              return (
                <div
                  key={sess.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{participant.full_name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>
                      ({participant.email}) — Sec {participant.section}, Yr {participant.academic_year}
                    </span>
                    {sess.reentry_reason && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--cyan-400)', marginTop: '0.2rem' }}>
                        Reason: &quot;{sess.reentry_reason}&quot;
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setReentryTarget({ user: participant, session: sess })}
                      className="btn btn-primary btn-sm"
                    >
                      <RotateCcw size={13} />
                      Review & Decide
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Section Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Section:</span>
          <select
            className="form-select"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{ width: '120px', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Sec</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
            <option value="E">Section E</option>
          </select>
        </div>

        {/* Year Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Year:</span>
          <select
            className="form-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ width: '120px', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Years</option>
            <option value="I">Year I</option>
            <option value="II">Year II</option>
            <option value="III">Year III</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: '130px', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Status</option>
            <option value="registered">Registered</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="disqualified">Disqualified</option>
          </select>
        </div>

        {/* Bulk activation */}
        <button
          onClick={handleActivateAll}
          disabled={activatingAll || loading}
          className="btn btn-success"
          style={{ marginLeft: 'auto' }}
          title="Activate every shown participant that is not already active or disqualified"
        >
          <UserCheck size={16} />
          {activatingAll ? 'Activating...' : 'Activate All'}
        </button>
      </div>

      {/* Participants Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Student ID</th>
              <th>Section</th>
              <th>Year</th>
              <th>Status</th>
              <th>Exam Attempt</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading participants directory...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No participants found matching the selected filters.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                let statusBadge = 'badge-cyan';
                if (p.registration_status === 'active') statusBadge = 'badge-emerald';
                if (p.registration_status === 'suspended') statusBadge = 'badge-amber';
                if (p.registration_status === 'disqualified') statusBadge = 'badge-rose';

                const pSession = sessions.find(s => s.participant_id === p.user_id);

                return (
                  <tr key={p.user_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{p.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{p.email}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {p.college_id || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-cyan">Sec {p.section}</span>
                    </td>
                    <td>
                      <span className="badge badge-purple">Yr {p.academic_year}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge}`}>{p.registration_status?.toUpperCase()}</span>
                    </td>
                    <td>
                      {pSession ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className={`badge ${
                              pSession.status === 'completed'
                                ? 'badge-emerald'
                                : pSession.is_locked
                                  ? 'badge-rose'
                                  : 'badge-cyan'
                            }`} style={{ fontSize: '0.7rem' }}>
                              {pSession.status.toUpperCase()}
                            </span>
                            {pSession.reentry_status === 'requested' && (
                              <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                                RE-ENTRY REQ
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Score: {pSession.final_score} pts • Q{pSession.current_question_index || 0 + 1}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Not Started
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {/* Manage Exam Re-entry Button (Modification A) */}
                        {pSession && (
                          <button
                            onClick={() => setReentryTarget({ user: p, session: pSession })}
                            className="btn btn-secondary btn-sm"
                            title="Manage Exam Re-Entry Authorization"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}

                        {p.registration_status !== 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(p, 'active')}
                            className="btn btn-success btn-sm"
                            title="Activate account"
                          >
                            <UserCheck size={13} />
                          </button>
                        )}
                        {p.registration_status !== 'suspended' && (
                          <button
                            onClick={() => handleUpdateStatus(p, 'suspended')}
                            className="btn btn-secondary btn-sm"
                            title="Suspend account"
                          >
                            <UserX size={13} />
                          </button>
                        )}
                        {p.registration_status !== 'disqualified' && (
                          <button
                            onClick={() => handleUpdateStatus(p, 'disqualified')}
                            className="btn btn-danger btn-sm"
                            title="Disqualify account"
                          >
                            <AlertTriangle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Re-entry Decision Modal (Modification A: Minimum Necessary Admin Control) */}
      {reentryTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <RotateCcw size={20} color="var(--cyan-400)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Authorize Exam Re-Entry</h3>
              </div>
              <button
                onClick={() => setReentryTarget(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Participant: <strong style={{ color: '#FFFFFF' }}>{reentryTarget.user.full_name}</strong> ({reentryTarget.user.email})<br />
              Current Session: <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{reentryTarget.session.phase.toUpperCase()}</span> — Status: <strong style={{ color: 'var(--amber-400)' }}>{reentryTarget.session.status}</strong> (Locked: {reentryTarget.session.is_locked ? 'Yes' : 'No'})
            </p>

            {reentryTarget.session.reentry_reason && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(0, 242, 254, 0.08)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Participant Stated Reason:</div>
                <div style={{ color: '#FFFFFF', marginTop: '0.2rem' }}>&quot;{reentryTarget.session.reentry_reason}&quot;</div>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Administrative Audit Reason:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Audit reason for approval/rejection (e.g., Verified lab network disconnect)..."
                value={reentryActionReason}
                onChange={(e) => setReentryActionReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Option 1: Resume Session */}
              <button
                onClick={() => handleReentryDecision('resume')}
                disabled={processingReentry}
                className="btn btn-primary"
                style={{ justifyContent: 'center' }}
              >
                <Play size={16} />
                Resume Existing Session (Keep Answers & Progress)
              </button>

              {/* Option 2: Authorize Fresh Attempt */}
              <button
                onClick={() => handleReentryDecision('fresh')}
                disabled={processingReentry}
                className="btn btn-secondary"
                style={{ justifyContent: 'center', borderColor: 'var(--cyan-400)', color: 'var(--cyan-400)' }}
              >
                <RotateCcw size={16} />
                Authorize Fresh Attempt (Reset Timer, Preserve History)
              </button>

              {/* Option 3: Reject Re-entry */}
              <button
                onClick={() => handleReentryDecision('reject')}
                disabled={processingReentry}
                className="btn btn-danger btn-sm"
                style={{ justifyContent: 'center', marginTop: '0.5rem' }}
              >
                <XCircle size={14} />
                Reject Re-Entry Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
