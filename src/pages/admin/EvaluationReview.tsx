// TECH EXPERT 2K26 — EVALUATION REVIEW & MANUAL OVERRIDES
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { RunResult } from '../../types';
import {
  Eye,
  Cpu,
  X
} from 'lucide-react';

export const EvaluationReview: React.FC = () => {
  const [runs, setRuns] = useState<RunResult[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunResult | null>(null);
  const [overrideDecision, setOverrideDecision] = useState<boolean>(true);
  const [overrideReason, setOverrideReason] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const data = await api.getRunResults();
      setRuns(data);
    } catch (err) {
      console.error('Failed to load run results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRun) return;
    if (!overrideReason.trim()) {
      alert('A mandatory administrative reason is required for evaluation override.');
      return;
    }

    setSavingOverride(true);
    try {
      await api.overrideEvaluation(selectedRun.id, overrideDecision, overrideReason.trim());
      alert('Manual evaluation override applied successfully and recorded in audit logs.');
      setSelectedRun(null);
      setOverrideReason('');
      await loadRuns();
    } catch (err: any) {
      alert(`Failed to apply override: ${err.message}`);
    } finally {
      setSavingOverride(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
          Quality Assurance & Dispute Resolution
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)' }}>Evaluation Review Portal</h1>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Inspect participant code runs, AI Gemini verdicts, error logs, and perform audited administrative overrides.
        </div>
      </div>

      {/* Submissions / Runs Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Phase & Question</th>
              <th>AI Verdict</th>
              <th>Status</th>
              <th>Submitted At</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                  Loading submission runs...
                </td>
              </tr>
            ) : runs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                  No program code submissions recorded yet. Submissions from Phase 2 and Phase 3 will appear here.
                </td>
              </tr>
            ) : (
              runs.map((r) => {
                let badgeClass = r.is_accepted ? 'badge-success' : 'badge-danger';
                if (r.evaluation_status === 'overridden') badgeClass = 'badge-warning';

                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{r.participant_name || 'Participant'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        {r.participant_email} {r.participant_section && `(Sec ${r.participant_section})`}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{r.question_title || 'Coding Problem'}</div>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        {r.phase.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {r.is_accepted ? 'ACCEPTED' : 'REJECTED'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                        {r.evaluation_status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedRun(r)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Eye size={13} /> Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Inspection & Manual Override Modal */}
      {selectedRun && (
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
          <div className="card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: 'var(--shadow-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.3rem' }}>
                  SUBMISSION INSPECTOR
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                  {selectedRun.question_title} — {selectedRun.participant_name}
                </h3>
              </div>
              <button onClick={() => setSelectedRun(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Submitted Source Code */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '0.4rem' }}>
                Participant Submitted Python Code:
              </div>
              <pre style={{
                padding: '1rem',
                backgroundColor: 'var(--color-surface-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text)',
                overflowX: 'auto',
                maxHeight: '220px'
              }}>
                {selectedRun.submitted_code}
              </pre>
            </div>

            {/* AI Assessment */}
            <div style={{
              backgroundColor: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                  <Cpu size={16} color="var(--color-primary)" />
                  Original Gemini AI Assessment
                </div>
                <span className={`badge ${selectedRun.is_accepted ? 'badge-success' : 'badge-danger'}`}>
                  {selectedRun.is_accepted ? 'ACCEPTED' : 'REJECTED'}
                </span>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                <strong>Explanation:</strong> {selectedRun.ai_response?.explanation || 'No explanation'}
              </div>

              <div style={{
                backgroundColor: 'var(--color-surface)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: selectedRun.is_accepted ? 'var(--color-success)' : 'var(--color-danger)',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedRun.ai_response?.predicted_output || 'No output recorded'}
              </div>
            </div>

            {/* Administrative Override Form */}
            <form onSubmit={handleApplyOverride} style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-warning)' }}>
                Apply Administrative Override
              </div>

              <div>
                <label className="form-label">New Official Decision</label>
                <select
                  className="form-select"
                  value={overrideDecision ? 'true' : 'false'}
                  onChange={(e) => setOverrideDecision(e.target.value === 'true')}
                >
                  <option value="true">ACCEPT Solution (Mark Solved & Award Full Points)</option>
                  <option value="false">REJECT Solution (Mark Incorrect / Revert Points)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Mandatory Administrative Reason</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Code meets mathematical proof of edge case overlooked by AI rubric prompt."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedRun(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOverride}
                  className="btn btn-primary"
                >
                  {savingOverride ? 'Applying...' : 'Confirm Audited Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
