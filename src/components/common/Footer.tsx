// TECH EXPERT 2K26 — FOOTER
// Sri Venkateswara College of Engineering (SVCE)

import React from 'react';
import { Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--color-border)',
      backgroundColor: '#FFFFFF',
      padding: '2rem 0',
      marginTop: 'auto',
      color: 'var(--color-text-secondary)',
      fontSize: '0.875rem'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid var(--color-primary)',
              boxShadow: '0 1px 4px rgba(37, 99, 235, 0.2)',
              backgroundColor: '#FFFFFF',
              flexShrink: 0
            }}>
              <img
                src="/logo.png"
                alt="Tech Expert Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
              />
            </div>
            <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.95rem' }}>
              TECH EXPERT 2K26
            </span>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <span style={{ fontSize: '0.85rem' }}>Sri Venkateswara College of Engineering (SVCE)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)' }}>
              <Cpu size={14} /> AI-Powered Code Evaluation Engine
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1rem',
          fontSize: '0.775rem',
          color: 'var(--color-text-secondary)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div>
            &copy; 2026 SVCE Tech Expert Organizing Committee. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>Clean Blue SaaS Edition</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
