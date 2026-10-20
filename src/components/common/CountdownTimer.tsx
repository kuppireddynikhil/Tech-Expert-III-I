// TECH EXPERT 2K26 — AUTHORITATIVE COUNTDOWN TIMER
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  durationSeconds: number; // Duration configured for question/phase
  startTimeMs?: number;    // Authoritative start timestamp in ms (e.g. from server session)
  onExpire?: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  isReset?: boolean;       // Forcibly resets and stops timer (e.g. when phase is closed)
  isPaused?: boolean;      // Forcibly pauses timer (e.g. when administrator pauses phase)
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  durationSeconds,
  startTimeMs,
  onExpire,
  label = 'Time Remaining',
  size = 'md',
  isReset = false,
  isPaused = false
}) => {
  // If no startTimeMs passed, default to when this component mounted (stored in ref so state re-renders don't reset)
  const initialMountTime = useRef(Date.now());
  const effectiveStart = startTimeMs || initialMountTime.current;
  const deadlineMs = effectiveStart + (durationSeconds * 1000);

  const calculateRemaining = () => {
    if (isReset) return 0;
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((deadlineMs - now) / 1000));
    return remaining;
  };

  const [remainingSeconds, setRemainingSeconds] = useState(calculateRemaining);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (isReset) {
      setRemainingSeconds(0);
      return;
    }

    if (isPaused) {
      // While paused, do not update or expire
      return;
    }

    // Reset expiration flag if duration or start changes
    expiredRef.current = false;

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [durationSeconds, startTimeMs, onExpire, isReset, isPaused]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const percentLeft = durationSeconds > 0 ? Math.min(100, (remainingSeconds / durationSeconds) * 100) : 0;

  // Status colors
  let colorClass = 'var(--cyan-400)';
  let bgClass = 'rgba(0, 242, 254, 0.1)';
  let borderClass = 'rgba(0, 242, 254, 0.3)';

  if (isReset) {
    colorClass = 'var(--text-dim)';
    bgClass = 'rgba(15, 23, 42, 0.6)';
    borderClass = 'var(--border-subtle)';
  } else if (isPaused) {
    colorClass = 'var(--amber-400)';
    bgClass = 'rgba(245, 158, 11, 0.15)';
    borderClass = 'var(--amber-400)';
  } else if (percentLeft <= 20 || remainingSeconds <= 10) {
    colorClass = 'var(--rose-400)';
    bgClass = 'rgba(244, 63, 94, 0.15)';
    borderClass = 'var(--rose-400)';
  } else if (percentLeft <= 40) {
    colorClass = 'var(--amber-400)';
    bgClass = 'rgba(245, 158, 11, 0.15)';
    borderClass = 'var(--amber-400)';
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.6rem',
      padding: size === 'sm' ? '0.35rem 0.75rem' : size === 'lg' ? '0.75rem 1.5rem' : '0.5rem 1rem',
      backgroundColor: bgClass,
      border: `1px solid ${borderClass}`,
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-mono)',
      color: colorClass,
      fontWeight: 700,
      fontSize: size === 'sm' ? '0.9rem' : size === 'lg' ? '1.5rem' : '1.15rem',
      boxShadow: remainingSeconds <= 10 ? 'var(--shadow-rose)' : 'none',
      transition: 'all var(--transition-fast)'
    }}>
      {remainingSeconds <= 10 ? (
        <AlertTriangle size={size === 'sm' ? 16 : size === 'lg' ? 24 : 18} className="animate-pulse-subtle" />
      ) : (
        <Clock size={size === 'sm' ? 16 : size === 'lg' ? 24 : 18} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {label && size !== 'sm' && (
          <span style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-display)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            fontWeight: 600,
            lineHeight: 1
          }}>
            {label}
          </span>
        )}
        <span>{isPaused ? `${formattedTime} (PAUSED)` : formattedTime}</span>
      </div>
    </div>
  );
};
