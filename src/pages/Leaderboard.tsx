// TECH EXPERT 2K26 — LEADERBOARD & WINNERS
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { LeaderboardEntry, CompetitionSettings, PhaseLeaderboardEntry, PhaseId } from '../types';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  Crown,
  Search,
  EyeOff,
  Sparkles,
  Zap,
  Code2
} from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { isAdmin } = useAuth();

  const [settings, setSettings] = useState<CompetitionSettings | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'overall' | 'phase1' | 'phase2' | 'phase3'>('overall');
  const [phaseEntries, setPhaseEntries] = useState<PhaseLeaderboardEntry[]>([]);
  const [loadingPhase, setLoadingPhase] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const [s, data] = await Promise.all([
          api.getCompetitionSettings(),
          api.getLeaderboard()
        ]);
        setSettings(s);
        setEntries(data);

        // If winner declared, shoot confetti
        if (s.winner_id) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.4 }
          });
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  // Load phase-specific leaderboard when tab changes
  useEffect(() => {
    if (activeTab === 'overall') return;

    async function loadPhaseData() {
      setLoadingPhase(true);
      try {
        const data = await api.getPhaseLeaderboard(activeTab as PhaseId);
        setPhaseEntries(data);
      } catch (err) {
        console.error(`Failed to load ${activeTab} leaderboard:`, err);
      } finally {
        setLoadingPhase(false);
      }
    }
    loadPhaseData();
  }, [activeTab]);

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    const matchesSearch = 
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchesSection = selectedSection === 'ALL' || e.section === selectedSection;
    const matchesYear = selectedYear === 'ALL' || e.academic_year === selectedYear;

    return matchesSearch && matchesSection && matchesYear;
  });

  const filteredPhaseEntries = phaseEntries.filter((e) => {
    const matchesSearch = 
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchesSection = selectedSection === 'ALL' || e.section === selectedSection;
    const matchesYear = selectedYear === 'ALL' || e.academic_year === selectedYear;

    return matchesSearch && matchesSection && matchesYear;
  });

  const winner = entries.find(e => e.is_winner) || entries[0];
  const runnerUp = entries.find(e => e.is_runner_up) || entries[1];

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading official competition rankings...</p>
      </div>
    );
  }

  // Check visibility for non-admins
  if (!settings?.leaderboard_visible && !isAdmin) {
    return (
      <div className="container-narrow">
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <EyeOff size={32} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem', color: 'var(--color-text)' }}>Leaderboard Under Review</h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            The official event leaderboard is currently hidden by the organizer while evaluations are verified.
            Please check back soon for the confirmed standings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Leaderboard Header */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <div className="badge badge-primary" style={{ marginBottom: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={14} /> SVCE Official Rankings
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
          Tech Expert 2K26 Leaderboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem' }}>
          Real-time aggregated standings across Quick Quiz, Debugging Challenge, and Logic Builder Finals.
        </p>
      </div>

      {/* Leaderboard View Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        margin: '0 auto'
      }}>
        <button
          onClick={() => setActiveTab('overall')}
          className={`btn ${activeTab === 'overall' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Trophy size={16} /> Overall Standings
        </button>
        <button
          onClick={() => setActiveTab('phase1')}
          className={`btn ${activeTab === 'phase1' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Zap size={16} /> Phase 1: Quick Quiz
        </button>
        <button
          onClick={() => setActiveTab('phase2')}
          className={`btn ${activeTab === 'phase2' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Code2 size={16} /> Phase 2: Debugging
        </button>
        <button
          onClick={() => setActiveTab('phase3')}
          className={`btn ${activeTab === 'phase3' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Crown size={16} /> Phase 3: Logic Finals
        </button>
      </div>

      {/* Podium Display (Winner & Runner-up) - Only on Overall Tab */}
      {activeTab === 'overall' && entries.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          maxWidth: '850px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Winner Card */}
          {winner && (
            <div className="card" style={{
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: '2px solid var(--color-primary)',
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: 'var(--color-primary)'
              }} />
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                border: '2px solid var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Crown size={32} color="var(--color-primary)" />
              </div>
              <span className="badge badge-primary" style={{ marginBottom: '0.5rem', fontWeight: 700 }}>EVENT WINNER</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-text)' }}>{winner.full_name}</h3>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Section {winner.section} • Year {winner.academic_year}
              </div>
              <div style={{
                display: 'flex',
                gap: '1.75rem',
                backgroundColor: 'var(--color-surface-secondary)',
                padding: '0.85rem 1.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                width: '100%',
                justifyContent: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Score</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>{winner.total_score}</div>
                </div>
                <div style={{ width: '1px', backgroundColor: 'var(--color-border)' }} />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Phase 3 Solved</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>{winner.phase3_solved} / 3</div>
                </div>
              </div>
            </div>
          )}

          {/* Runner-up Card */}
          {runnerUp && (
            <div className="card" style={{
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: 'var(--color-border)'
              }} />
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-surface-secondary)',
                border: '2px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Medal size={32} color="var(--color-text-secondary)" />
              </div>
              <span className="badge badge-secondary" style={{ marginBottom: '0.5rem', fontWeight: 700 }}>RUNNER-UP</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-text)' }}>{runnerUp.full_name}</h3>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Section {runnerUp.section} • Year {runnerUp.academic_year}
              </div>
              <div style={{
                display: 'flex',
                gap: '1.75rem',
                backgroundColor: 'var(--color-surface-secondary)',
                padding: '0.85rem 1.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                width: '100%',
                justifyContent: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Score</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>{runnerUp.total_score}</div>
                </div>
                <div style={{ width: '1px', backgroundColor: 'var(--color-border)' }} />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Phase 3 Solved</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>{runnerUp.phase3_solved} / 3</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search participant by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Section Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Section:</span>
          <select
            className="form-select"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{ width: '130px', padding: '0.55rem 0.75rem', fontSize: '0.875rem' }}
          >
            <option value="ALL">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
            <option value="E">Section E</option>
          </select>
        </div>

        {/* Year Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Year:</span>
          <select
            className="form-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ width: '130px', padding: '0.55rem 0.75rem', fontSize: '0.875rem' }}
          >
            <option value="ALL">All Years</option>
            <option value="I">Year I</option>
            <option value="II">Year II</option>
            <option value="III">Year III</option>
          </select>
        </div>
      </div>

      {/* Rankings Table */}
      {activeTab === 'overall' ? (
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Rank</th>
                <th>Participant</th>
                <th>Section</th>
                <th>Year</th>
                <th>Phase 1 (Quiz)</th>
                <th>Phase 2 (Debug)</th>
                <th>Phase 3 (Logic)</th>
                <th>Total Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                    No participants matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <tr key={entry.user_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {isTop1 ? (
                            <span className="badge badge-primary" style={{ fontWeight: 800 }}>#1</span>
                          ) : isTop2 ? (
                            <span className="badge badge-secondary" style={{ fontWeight: 700 }}>#2</span>
                          ) : isTop3 ? (
                            <span className="badge badge-secondary" style={{ fontWeight: 700 }}>#3</span>
                          ) : (
                            <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginLeft: '4px' }}>
                              #{entry.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{entry.full_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{entry.email}</div>
                      </td>
                      <td>
                        <span className="badge badge-primary">Sec {entry.section}</span>
                      </td>
                      <td>
                        <span className="badge badge-secondary">Yr {entry.academic_year}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--color-primary)' }}>{entry.phase1_score} pts</strong>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--color-primary)' }}>{entry.phase2_score} pts</strong>
                      </td>
                      <td>
                        <span className={`badge ${entry.phase3_solved > 0 ? 'badge-success' : 'badge-secondary'}`}>
                          {entry.phase3_solved} / 3 Solved
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                          {entry.total_score}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Phase-Specific Run Leaderboard */
        <div className="custom-table-container">
          {loadingPhase ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
              <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 0.75rem auto' }} />
              Loading {activeTab.toUpperCase()} run standings...
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Participant</th>
                  <th>Section</th>
                  <th>Year</th>
                  <th>Run</th>
                  <th>Score / Result</th>
                  <th>Performance Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredPhaseEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                      No participant attempts recorded for {activeTab.toUpperCase()} yet.
                    </td>
                  </tr>
                ) : (
                  filteredPhaseEntries.map((entry) => {
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;

                    return (
                      <tr key={entry.user_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {isTop1 ? (
                              <span className="badge badge-primary" style={{ fontWeight: 800 }}>#1</span>
                            ) : isTop2 ? (
                              <span className="badge badge-secondary" style={{ fontWeight: 700 }}>#2</span>
                            ) : isTop3 ? (
                              <span className="badge badge-secondary" style={{ fontWeight: 700 }}>#3</span>
                            ) : (
                              <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginLeft: '4px' }}>
                                #{entry.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{entry.full_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{entry.email}</div>
                        </td>
                        <td>
                          <span className="badge badge-primary">Sec {entry.section}</span>
                        </td>
                        <td>
                          <span className="badge badge-secondary">Yr {entry.academic_year}</span>
                        </td>
                        <td>
                          <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                            Run #{entry.run_number}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                            {entry.score} pts
                          </strong>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                          {entry.detail || '—'}
                          {entry.time_spent_seconds && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                              Time: {entry.time_spent_seconds}s
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
