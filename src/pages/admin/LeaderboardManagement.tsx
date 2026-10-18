// TECH EXPERT 2K26 — LEADERBOARD & WINNERS MANAGEMENT
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { LeaderboardEntry, CompetitionSettings } from '../../types';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Crown,
  Medal,
  Eye,
  EyeOff,
  CheckCircle2,
  Award,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const LeaderboardManagement: React.FC = () => {
  const [settings, setSettings] = useState<CompetitionSettings | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, data] = await Promise.all([
        api.getCompetitionSettings(),
        api.getLeaderboard()
      ]);
      setSettings(s);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load leaderboard management:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleVisibility = async () => {
    if (!settings) return;
    const newVis = !settings.leaderboard_visible;

    try {
      await api.updateCompetitionSettings(
        { leaderboard_visible: newVis },
        `Leaderboard visibility set to ${newVis ? 'PUBLIC' : 'HIDDEN'}`
      );
      await loadData();
    } catch (err: any) {
      alert(`Error updating visibility: ${err.message}`);
    }
  };

  const handleDeclareWinnerAndRunnerUp = async (winnerId: string, runnerUpId: string) => {
    if (!confirm('Officially certify this Winner and Runner-up on the blockchain/database records?')) return;

    setSaving(true);
    try {
      await api.updateCompetitionSettings(
        {
          winner_id: winnerId,
          runner_up_id: runnerUpId,
          winner_declared_at: new Date().toISOString(),
          leaderboard_visible: true
        },
        'Certified Event Winner and Runner-up'
      );

      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 }
      });

      alert('Winner and Runner-up certified successfully!');
      await loadData();
    } catch (err: any) {
      alert(`Error declaring winners: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto', border: '3px solid rgba(245, 158, 11, 0.2)', borderTopColor: 'var(--amber-400)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Leaderboard Governance...</p>
      </div>
    );
  }

  const top1 = entries[0];
  const top2 = entries[1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>
            Event Certification
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Leaderboard & Winner Management</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Control public leaderboard visibility, audit provisional ranks, and certify the Winner and Runner-up.
          </div>
        </div>

        <button
          onClick={handleToggleVisibility}
          className={`btn ${settings.leaderboard_visible ? 'btn-secondary' : 'btn-primary'}`}
        >
          {settings.leaderboard_visible ? (
            <>
              <EyeOff size={16} /> Hide Leaderboard from Public
            </>
          ) : (
            <>
              <Eye size={16} /> Make Leaderboard Public
            </>
          )}
        </button>
      </div>

      {/* Certification Control Banner */}
      <div className="glass-card-glow" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Award size={20} color="var(--amber-400)" />
            <h3 style={{ fontSize: '1.25rem' }}>Winner Certification Engine</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px' }}>
            Deterministic tie-break rules: 1st Phase 3 Solved Count &rarr; 2nd Earliest Completion Time &rarr; 3rd Total Cumulative Points.
          </p>
        </div>

        {top1 && top2 && (
          <button
            onClick={() => handleDeclareWinnerAndRunnerUp(top1.user_id, top2.user_id)}
            disabled={saving}
            className="btn btn-primary btn-lg"
          >
            <Crown size={18} />
            Certify Current Ranks #1 and #2 as Winners
          </button>
        )}
      </div>

      {/* Confirmed Winners Status Card if declared */}
      {settings.winner_id && (
        <div className="glass-card" style={{ padding: '1.5rem', borderColor: 'var(--amber-400)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Crown size={22} color="var(--amber-400)" />
            <strong style={{ fontSize: '1.1rem', color: '#FFFFFF' }}>Confirmed Event Winners:</strong>
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Winner (Gold):</span>{' '}
              <strong style={{ color: 'var(--amber-400)' }}>
                {entries.find(e => e.user_id === settings.winner_id)?.full_name || settings.winner_id}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Runner-up (Silver):</span>{' '}
              <strong style={{ color: '#E2E8F0' }}>
                {entries.find(e => e.user_id === settings.runner_up_id)?.full_name || settings.runner_up_id}
              </strong>
            </div>
            <div style={{ color: 'var(--text-dim)' }}>
              Certified at: {settings.winner_declared_at ? new Date(settings.winner_declared_at).toLocaleString() : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Authoritative Rankings Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Participant</th>
              <th>Section</th>
              <th>Year</th>
              <th>Phase 1</th>
              <th>Phase 2</th>
              <th>Phase 3 Solved</th>
              <th>Total Score</th>
              <th>Certification</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.user_id}>
                <td>
                  <span style={{ fontWeight: 800, color: entry.rank <= 2 ? 'var(--amber-400)' : 'var(--text-muted)' }}>
                    #{entry.rank}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{entry.full_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{entry.email}</div>
                </td>
                <td>
                  <span className="badge badge-cyan">Sec {entry.section}</span>
                </td>
                <td>
                  <span className="badge badge-purple">Yr {entry.academic_year}</span>
                </td>
                <td>{entry.phase1_score} pts</td>
                <td>{entry.phase2_score} pts</td>
                <td>
                  <span className={`badge ${entry.phase3_solved > 0 ? 'badge-emerald' : 'badge-rose'}`}>
                    {entry.phase3_solved} / 3
                  </span>
                </td>
                <td>
                  <strong style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>{entry.total_score}</strong>
                </td>
                <td>
                  {entry.is_winner ? (
                    <span className="badge badge-amber">WINNER</span>
                  ) : entry.is_runner_up ? (
                    <span className="badge badge-cyan">RUNNER-UP</span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Participant</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
