// TECH EXPERT 2K26 — LEADERBOARD & WINNERS
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { LeaderboardEntry, CompetitionSettings, SectionType, AcademicYearType, PhaseLeaderboardEntry, PhaseId } from '../types';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  Crown,
  Search,
  Filter,
  EyeOff,
  Sparkles,
  Users,
  CheckCircle2,
  Zap,
  Code2,
  Layers,
  Clock
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
            particleCount: 120,
            spread: 80,
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
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto', border: '3px solid rgba(245, 158, 11, 0.2)', borderTopColor: 'var(--amber-400)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading official competition rankings...</p>
      </div>
    );
  }

  // Check visibility for non-admins
  if (!settings?.leaderboard_visible && !isAdmin) {
    return (
      <div className="container-narrow">
        <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <EyeOff size={32} color="var(--amber-400)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Leaderboard Under Review</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
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
        <div className="badge badge-amber" style={{ marginBottom: '0.75rem' }}>
          <Sparkles size={14} /> SVCE Official Rankings
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '0.5rem' }}>
          Tech Expert 2K26 Leaderboard
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
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
          <Trophy size={16} /> Overall Fest Standings
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Winner Card */}
          {winner && (
            <div className="glass-card-glow" style={{
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              borderColor: 'var(--amber-400)',
              boxShadow: 'var(--shadow-amber)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '2px solid var(--amber-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Crown size={32} color="var(--amber-400)" />
              </div>
              <span className="badge badge-amber" style={{ marginBottom: '0.5rem' }}>EVENT WINNER</span>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{winner.full_name}</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Section {winner.section} • Year {winner.academic_year}
              </div>
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Score</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--cyan-400)' }}>{winner.total_score}</div>
                </div>
                <div style={{ width: '1px', backgroundColor: 'var(--border-subtle)' }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Phase 3 Solved</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--emerald-400)' }}>{winner.phase3_solved} / 3</div>
                </div>
              </div>
            </div>
          )}

          {/* Runner-up Card */}
          {runnerUp && (
            <div className="glass-card" style={{
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              borderColor: 'rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Medal size={32} color="#E2E8F0" />
              </div>
              <span className="badge badge-cyan" style={{ marginBottom: '0.5rem' }}>RUNNER-UP</span>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{runnerUp.full_name}</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Section {runnerUp.section} • Year {runnerUp.academic_year}
              </div>
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Score</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--cyan-400)' }}>{runnerUp.total_score}</div>
                </div>
                <div style={{ width: '1px', backgroundColor: 'var(--border-subtle)' }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Phase 3 Solved</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--emerald-400)' }}>{runnerUp.phase3_solved} / 3</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
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
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Section:</span>
          <select
            className="form-select"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{ width: '120px', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
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
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
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
                            <Crown size={18} color="var(--amber-400)" />
                          ) : isTop2 ? (
                            <Medal size={18} color="#CBD5E1" />
                          ) : isTop3 ? (
                            <Medal size={18} color="#D97706" />
                          ) : (
                            <span style={{ fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>
                              #{entry.rank}
                            </span>
                          )}
                        </div>
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
                      <td>
                        <strong style={{ color: 'var(--cyan-400)' }}>{entry.phase1_score} pts</strong>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--purple-400)' }}>{entry.phase2_score} pts</strong>
                      </td>
                      <td>
                        <span className={`badge ${entry.phase3_solved > 0 ? 'badge-emerald' : 'badge-rose'}`}>
                          {entry.phase3_solved} / 3 Solved
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
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
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
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
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
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
                              <Crown size={18} color="var(--amber-400)" />
                            ) : isTop2 ? (
                              <Medal size={18} color="#CBD5E1" />
                            ) : isTop3 ? (
                              <Medal size={18} color="#D97706" />
                            ) : (
                              <span style={{ fontWeight: 700, color: 'var(--text-muted)', marginLeft: '4px' }}>
                                #{entry.rank}
                              </span>
                            )}
                          </div>
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
                        <td>
                          <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                            Run #{entry.run_number}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--cyan-400)', fontSize: '1.05rem' }}>
                            {entry.score} pts
                          </strong>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {entry.detail || '—'}
                          {entry.time_spent_seconds && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
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
