// TECH EXPERT 2K26 — FOOTER
// Sri Venkateswara College of Engineering (SVCE)

import React from 'react';
import { Terminal, ShieldCheck, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      backgroundColor: 'rgba(7, 11, 20, 0.95)',
      padding: '2.5rem 0 2rem 0',
      marginTop: 'auto',
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Terminal size={20} color="var(--cyan-400)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#FFFFFF', fontSize: '1rem' }}>
              TECH EXPERT 2K26
            </span>
            <span style={{ color: 'var(--text-dim)' }}>|</span>
            <span>Sri Venkateswara College of Engineering (SVCE)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--emerald-400)' }}>
              <ShieldCheck size={14} /> Server RLS Protected
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--purple-400)' }}>
              <Cpu size={14} /> Gemini AI Code Evaluation Engine
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '1rem',
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            &copy; 2026 SVCE Tech Expert Organizing Committee. All rights reserved.
          </div>
          <div>
            AI simulated output is probabilistic and subject to administrative review.
          </div>
        </div>
      </div>
    </footer>
  );
};
