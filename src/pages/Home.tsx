// TECH EXPERT 2K26 — LANDING PAGE
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { CompetitionSettings, PhaseControl } from '../types';
import { 
  Terminal, 
  Cpu, 
  Zap, 
  Code2, 
  Trophy, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  Award,
  Users,
  CheckCircle2,
  Sparkles,
  Lock
} from 'lucide-react';

export const Home: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState<CompetitionSettings | null>(null);
  const [phases, setPhases] = useState<Record<string, PhaseControl> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [s, p] = await Promise.all([
          api.getCompetitionSettings(),
          api.getPhaseControls()
        ]);
        setSettings(s);
        setPhases(p);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        position: 'relative'
      }}>
        {/* Fest Badge */}
        <div className="badge badge-purple" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
          <Sparkles size={14} /> SVCE College Branch Fest — Tech Expert 2K26
        </div>

        {/* Big Glow Title */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          maxWidth: '900px',
          lineHeight: 1.15
        }}>
          Master Python Under Pressure.{' '}
          <span className="text-gradient-cyan">Powered by Gemini AI.</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-muted)',
          maxWidth: '700px',
          lineHeight: 1.6
        }}>
          The ultimate 3-phase Python battle at Sri Venkateswara College of Engineering. 
          Real-time timers, Monaco Editor coding, simulated AI evaluation, and centralized administrator control.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          {user ? (
            <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} className="btn btn-primary btn-lg">
              {isAdmin ? "Open Admin Control Center" : "Enter Participant Dashboard"}
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Register as Participant
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Participant Login
              </Link>
            </>
          )}

          <Link to="/leaderboard" className="btn btn-secondary btn-lg">
            <Trophy size={18} color="var(--amber-400)" />
            Live Leaderboard
          </Link>
        </div>

        {/* Quick Highlights Bar */}
        <div style={{
          display: 'flex',
          gap: '2.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '2rem',
          padding: '1.25rem 2rem',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={18} color="var(--cyan-400)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>3 Competitive Phases</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="var(--amber-400)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>Authoritative Timers</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} color="var(--purple-400)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>Gemini AI Evaluation</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="var(--emerald-400)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>Full Admin Governance</span>
          </div>
        </div>
      </section>

      {/* 3 Competition Phases Breakdown */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>The Three Battlefronts</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Each phase tests Python mastery from lightning syntax reflexes to deep algorithmic problem solving.
          </p>
        </div>

        <div className="grid-3">
          {/* Phase 1 Card */}
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(0, 242, 254, 0.12)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={26} color="var(--cyan-400)" />
              </div>
              <span className={`badge ${phases?.phase1?.status === 'active' ? 'badge-emerald' : 'badge-cyan'}`}>
                {phases?.phase1?.status === 'active' ? 'LIVE NOW' : 'PHASE 1'}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>Python Quick Quiz</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Rapid-fire multiple choice questions testing Python data structures, operators, loops, comprehensions, and gotchas.
              </p>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="var(--cyan-400)" /> 20 Questions per assigned set
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="var(--cyan-400)" /> 15s per-question authoritative countdown
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="var(--cyan-400)" /> Top 15 participants qualify for Phase 2
              </li>
            </ul>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <Link to="/phase1" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                Enter Quick Quiz <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Phase 2 Card */}
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Code2 size={26} color="var(--purple-400)" />
              </div>
              <span className={`badge ${phases?.phase2?.status === 'active' ? 'badge-emerald' : 'badge-purple'}`}>
                {phases?.phase2?.status === 'active' ? 'LIVE NOW' : 'PHASE 2'}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>Python Debugging Challenge</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Inspect and fix subtle syntax, runtime, and logical bugs in real starter programs inside the embedded Monaco Editor.
              </p>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="var(--purple-400)" /> Up to 3 debugging programs
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="var(--purple-400)" /> 15 minutes overall phase deadline
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="var(--purple-400)" /> Top 5 finalists qualify for Phase 3
              </li>
            </ul>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <Link to="/phase2" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                Enter Debug Challenge <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Phase 3 Card */}
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trophy size={26} color="var(--amber-400)" />
              </div>
              <span className={`badge ${phases?.phase3?.status === 'active' ? 'badge-emerald' : 'badge-rose'}`}>
                {phases?.phase3?.status === 'active' ? 'FINALS' : 'PHASE 3'}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>Python Logic Builder</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                3 complex logic challenges for 5 finalists. Choose program order. High stakes: exactly 3 Run attempts per program before permanent lock!
              </p>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="var(--amber-400)" /> 3 Finalist programs (free order)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="var(--rose-400)" /> Max 3 Run attempts (locked on 3 fails)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="var(--amber-400)" /> 1st to solve all wins, 2nd is runner-up
              </li>
            </ul>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <Link to="/phase3" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                Enter Logic Builder <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* College & Department Fest Presentation */}
      <section style={{
        padding: '3rem',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '2rem'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <span className="badge badge-cyan" style={{ marginBottom: '1rem' }}>
            Sri Venkateswara College of Engineering (SVCE)
          </span>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Empowering the Next Generation of Python Developers
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Tech Expert 2K26 is the premier Python competition engineered for SVCE students across Sections A through E and Academic Years I, II, and III. Powered by Google Gemini AI code interpretation with full server-side governance and audited manual review.
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          minWidth: '240px'
        }}>
          <div className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Users size={24} color="var(--cyan-400)" />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Sections A – E</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Years I, II, and III Eligible</div>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck size={24} color="var(--emerald-400)" />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Role Verified</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RLS Secured Database</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
