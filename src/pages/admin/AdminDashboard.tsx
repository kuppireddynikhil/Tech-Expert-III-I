// TECH EXPERT 2K26 — ADMIN OVERVIEW DASHBOARD
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { 
  CompetitionSettings, 
  PhaseControl, 
  Profile, 
  Question, 
  QuestionSet, 
  QuestionSetAssignment,
  AdminAuditLog,
  PhaseId
} from '../../types';
import {
  Users,
  Database,
  Layers,
  Trophy,
  ArrowRight
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [settings, setSettings] = useState<CompetitionSettings | null>(null);
  const [phases, setPhases] = useState<Record<string, PhaseControl> | null>(null);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [assignments, setAssignments] = useState<QuestionSetAssignment[]>([]);
  const [recentLogs, setRecentLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminOverview = async () => {
    try {
      const [s, p, users, qs, sets, logs, assigns] = await Promise.all([
        api.getCompetitionSettings(),
        api.getPhaseControls(),
        api.getParticipants(),
        api.getQuestions(),
        api.getQuestionSets(),
        api.getAuditLogs(),
        api.getAssignments()
      ]);
      setSettings(s);
      setPhases(p);
      setParticipants(users);
      setQuestions(qs);
      setQuestionSets(sets);
      setAssignments(assigns);
      setRecentLogs(logs.slice(0, 6));
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminOverview();
  }, []);

  // Section A: Compute breakdown by registration status
  let activeCount = 0;
  let restrictedCount = 0;
  participants.forEach((p) => {
    if (p.registration_status === 'active' || p.registration_status === 'registered') {
      activeCount++;
    } else if (p.registration_status === 'suspended' || p.registration_status === 'disqualified') {
      restrictedCount++;
    }
  });

  // Section B: Unique Question Bank Count without double counting across joins/sets
  const uniqueQuestionsCount = new Set(questions.map((q) => q.id)).size;

  // Section C: Active Sets — Published & Assigned
  const publishedSets = questionSets.filter((s) => s.is_published && !s.is_archived);
  const activelyAssignedSetIds = new Set(
    assignments.filter((a) => a.is_active).map((a) => a.set_id)
  );

  // Section E: Compute distribution by Section (A–E)
  const sectionCounts: Record<'A' | 'B' | 'C' | 'D' | 'E', number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  participants.forEach((p) => {
    if (p.section && sectionCounts[p.section] !== undefined) {
      sectionCounts[p.section]++;
    }
  });

  // Section F: Compute distribution by Academic Year (I–III)
  const yearCounts: Record<'I' | 'II' | 'III', number> = { I: 0, II: 0, III: 0 };
  participants.forEach((p) => {
    if (p.academic_year && yearCounts[p.academic_year] !== undefined) {
      yearCounts[p.academic_year]++;
    }
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading Central Admin Governance metrics...</p>
      </div>
    );
  }

  const phaseOrder: PhaseId[] = ['phase1', 'phase2', 'phase3'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
            SVCE Tech Expert 2K26 Central Governance
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)' }}>Competition Overview</h1>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Live status, participant distributions, and stage management.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/questions/new" className="btn btn-primary btn-sm">
            + Create Question
          </Link>
          <Link to="/admin/phases" className="btn btn-secondary btn-sm">
            Phase Transitions
          </Link>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid-4">
        {/* Total Registered (Section A) */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Users size={24} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
              Total Registered
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)' }}>
              {participants.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
              {activeCount} Active • {restrictedCount} Restricted
            </div>
          </div>
        </div>

        {/* Central Question Bank (Section B) */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Database size={24} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
              Question Bank
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)' }}>
              {uniqueQuestionsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Across Phases 1, 2, and 3
            </div>
          </div>
        </div>

        {/* Question Sets (Section C) */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Layers size={24} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
              Active Sets
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)' }}>
              {publishedSets.length} / {questionSets.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {publishedSets.length} Published • {activelyAssignedSetIds.size} Assigned
            </div>
          </div>
        </div>

        {/* Leaderboard State (Section D) */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Trophy size={24} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
              Leaderboard
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: settings?.leaderboard_visible ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {settings?.leaderboard_visible ? 'PUBLIC' : 'HIDDEN'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              Stage: {settings?.current_phase ? settings.current_phase.toUpperCase() : 'PHASE 1'}
            </div>
          </div>
        </div>
      </div>

      {/* Distribution by Section and Year */}
      <div className="grid-2">
        {/* By Section (Section E) */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text)' }}>Participants by Section (A–E)</h3>
            <span className="badge badge-primary">SVCE Strict Enum</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {(['A', 'B', 'C', 'D', 'E'] as const).map((sec) => {
              const count = sectionCounts[sec] || 0;
              const pct = participants.length > 0 ? (count / participants.length) * 100 : 0;
              return (
                <div key={sec}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Section {sec}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Academic Year (Section F) */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text)' }}>Participants by Academic Year (I–III)</h3>
            <span className="badge badge-secondary">SVCE Strict Enum</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {(['I', 'II', 'III'] as const).map((yr) => {
              const count = yearCounts[yr] || 0;
              const pct = participants.length > 0 ? (count / participants.length) * 100 : 0;
              return (
                <div key={yr}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Year {yr}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phase Controls Overview (Section G) */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>Phase Governance Matrix</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Independent timers, qualification limits, and operational states
            </div>
          </div>
          <Link to="/admin/phases" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            Configure Transitions <ArrowRight size={14} />
          </Link>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Phase</th>
                <th>Status</th>
                <th>Timer / Deadline</th>
                <th>Qualification Target</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {phaseOrder.map((phaseKey) => {
                const p = phases?.[phaseKey];
                if (!p) return null;

                let badgeClass = 'badge-primary';
                if (p.status === 'active') badgeClass = 'badge-success';
                if (p.status === 'paused') badgeClass = 'badge-warning';
                if (p.status === 'closed') badgeClass = 'badge-danger';

                return (
                  <tr key={p.phase}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>ID: {p.phase}</div>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{p.status?.toUpperCase()}</span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                      {p.phase === 'phase1' && `${p.default_question_timer}s per question`}
                      {p.phase === 'phase2' && `${p.total_deadline_minutes} mins phase deadline`}
                      {p.phase === 'phase3' && 'No deadline • 3 attempts/prog'}
                    </td>
                    <td>
                      <span className="badge badge-secondary">Top {p.qualification_limit}</span>
                    </td>
                    <td>
                      <Link to="/admin/phases" className="btn btn-secondary btn-sm">
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Administrative Actions Log (Section H) */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>Recent Administrative Actions</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Tamper-evident audit trail of system modifications
            </div>
          </div>
          <Link to="/admin/audit-logs" className="btn btn-secondary btn-sm">
            View All Logs
          </Link>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Target</th>
                <th>Change Summary</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                    No recent administrative actions recorded.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="badge badge-primary">{log.action}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {log.target_type}:{log.target_id?.slice(0, 8)}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                      {log.change_summary}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
