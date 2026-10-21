// TECH EXPERT 2K26 — LANDING PAGE
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { CompetitionSettings, PhaseControl } from '../types';
import {
  Cpu,
  Zap,
  Code2,
  Trophy,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sparkles
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
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '3rem 1rem 2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        position: 'relative'
      }}>
        {/* Fest Badge */}
        <div className="badge badge-cyan" style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}>
          <Sparkles size={14} /> SVCE College Branch Fest — Tech Expert 2K26
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          maxWidth: '960px',
          lineHeight: 1.15,
          color: 'var(--color-text)'
        }}>
          <span style={{
            fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            display: 'block',
            marginBottom: '0.5rem',
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            Association of Intellectual Minds presents
          </span>
          <span>TECHNO STORM: </span>
          <span className="text-gradient-cyan">Tech Expert</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--color-text-secondary)',
          maxWidth: '680px',
          lineHeight: 1.6
        }}>
          Challenge Your Mind. Prove Your Code, Conquer the Storm! Multi-phase technical challenge testing algorithmic agility and logic mastery.
        </p>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '0.5rem',
            flexWrap: 'wrap'
          }}
        >
          {user ? (
            <Link
              to={isAdmin ? "/admin/dashboard" : "/dashboard"}
              className="btn btn-primary btn-lg"
            >
              {isAdmin ? "Open Admin Control Center" : "Enter Participant Dashboard"}
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="btn btn-primary btn-lg"
                style={{
                  minWidth: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                Register Now
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/login"
                className="btn btn-secondary btn-lg"
                style={{
                  minWidth: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Quick Highlights Bar */}
        <div style={{
          display: 'flex',
          gap: '2.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '1.5rem',
          padding: '1.25rem 2rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Zap size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 600 }}>3 Competitive Phases</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Clock size={18} color="var(--color-warning)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 600 }}>Authoritative Timers</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Cpu size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 600 }}>Gemini AI Evaluation</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={18} color="var(--color-success)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', fontWeight: 600 }}>Full Admin Governance</span>
          </div>
        </div>
      </section>

      {/* 3 Competition Phases Breakdown */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>The Three Battlefronts</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
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
                backgroundColor: 'var(--color-primary-light)',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={24} color="var(--color-primary)" />
              </div>
              <span className={`badge ${phases?.phase1?.status === 'active' ? 'badge-emerald' : 'badge-cyan'}`}>
                {phases?.phase1?.status === 'active' ? 'LIVE NOW' : 'PHASE 1'}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem', color: 'var(--color-text)' }}>Python Quick Quiz</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Rapid-fire multiple choice questions testing Python data structures, operators, loops, comprehensions, and gotchas.
              </p>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-primary)" /> 20 Questions per assigned set
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-primary)" /> 15s per-question authoritative countdown
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-primary)" /> Top 15 participants qualify for Phase 2
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
                backgroundColor: 'var(--color-primary-light)',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Code2 size={24} color="var(--color-primary)" />
              </div>
              <span className={`badge ${phases?.phase2?.status === 'active' ? 'badge-emerald' : 'badge-purple'}`}>
                {phases?.phase2?.status === 'active' ? 'LIVE NOW' : 'PHASE 2'}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem', color: 'var(--color-text)' }}>Python Debugging Challenge</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Inspect and fix subtle syntax, runtime, and logical bugs in real starter programs inside the embedded Monaco Editor.
              </p>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-primary)" /> Up to 3 debugging programs
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-primary)" /> 15 minutes overall phase deadline
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-primary)" /> Top 5 finalists qualify for Phase 3
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
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trophy size={24} color="var(--color-warning)" />
              </div>
              <span className={`badge ${phases?.phase3?.status === 'active' ? 'badge-emerald' : 'badge-amber'}`}>
                {phases?.phase3?.status === 'active' ? 'FINALS' : 'PHASE 3'}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem', color: 'var(--color-text)' }}>Python Logic Builder</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                3 complex logic challenges for 5 finalists. Choose program order. High stakes: exactly 3 Run attempts per program before permanent lock!
              </p>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-warning)" /> 3 Finalist programs (free order)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-danger)" /> Max 3 Run attempts (locked on 3 fails)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--color-success)" /> 1st to solve all wins, 2nd is runner-up
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
    </div>
  );
};
