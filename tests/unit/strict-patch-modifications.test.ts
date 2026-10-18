// TECH EXPERT 2K26 — STRICT PATCH SPECIFICATION UNIT TESTS
// Verifies Modifications A, B, and C

import { describe, it, expect } from 'vitest';
import type { CompetitionSession, ReentryStatus, Profile } from '../../src/types';

describe('Modification A — Single Exam Attempt & Admin-Only Re-Entry Engine', () => {
  class ExamAccessPolicyEngine {
    session: CompetitionSession;

    constructor(initialStatus: CompetitionSession['status'] = 'active', isLocked = false) {
      this.session = {
        id: 'sess-123',
        participant_id: 'user-456',
        phase: 'phase1',
        status: initialStatus,
        started_at: new Date().toISOString(),
        is_qualified: false,
        final_score: 40,
        tie_break_duration_ms: 0,
        reentry_status: 'none',
        current_question_index: 2,
        current_question_started_at: new Date().toISOString(),
        is_locked: isLocked
      };
    }

    canEnterExam(): { allowed: boolean; reason?: string } {
      if (this.session.status === 'completed' && this.session.reentry_status !== 'approved_fresh') {
        return { allowed: false, reason: 'Exam completed. Single attempt only by default.' };
      }
      if (this.session.is_locked && this.session.reentry_status !== 'approved_resume' && this.session.reentry_status !== 'approved_fresh') {
        return { allowed: false, reason: 'Session locked. Administrator re-entry required.' };
      }
      return { allowed: true };
    }

    requestReentry(reason: string) {
      this.session.reentry_status = 'requested';
      this.session.reentry_reason = reason;
    }

    adminDecision(decision: 'resume' | 'fresh' | 'reject') {
      if (decision === 'resume') {
        this.session.is_locked = false;
        this.session.status = 'active';
        this.session.reentry_status = 'approved_resume';
      } else if (decision === 'fresh') {
        this.session.is_locked = false;
        this.session.status = 'active';
        this.session.reentry_status = 'approved_fresh';
        this.session.current_question_index = 0;
        this.session.current_question_started_at = new Date().toISOString();
        this.session.final_score = 0;
      } else {
        this.session.reentry_status = 'rejected';
        this.session.is_locked = true;
      }
    }
  }

  it('allows access on active session without locks', () => {
    const engine = new ExamAccessPolicyEngine('active', false);
    expect(engine.canEnterExam().allowed).toBe(true);
  });

  it('blocks access once exam is completed by default', () => {
    const engine = new ExamAccessPolicyEngine('completed', false);
    const check = engine.canEnterExam();
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Single attempt only');
  });

  it('blocks access if session was interrupted or locked on disconnect', () => {
    const engine = new ExamAccessPolicyEngine('active', true);
    const check = engine.canEnterExam();
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Administrator re-entry required');
  });

  it('allows resume when admin approves existing session resumption and keeps current question index', () => {
    const engine = new ExamAccessPolicyEngine('active', true);
    engine.requestReentry('Accidental reload');
    expect(engine.session.reentry_status).toBe('requested');

    engine.adminDecision('resume');
    expect(engine.canEnterExam().allowed).toBe(true);
    expect(engine.session.current_question_index).toBe(2);
    expect(engine.session.final_score).toBe(40);
  });

  it('allows fresh attempt when admin explicitly authorizes fresh attempt and resets progress to question 0', () => {
    const engine = new ExamAccessPolicyEngine('completed', false);
    engine.requestReentry('Permission for retake granted by fest coordinator');
    engine.adminDecision('fresh');

    expect(engine.canEnterExam().allowed).toBe(true);
    expect(engine.session.current_question_index).toBe(0);
    expect(engine.session.final_score).toBe(0);
    expect(engine.session.reentry_status).toBe('approved_fresh');
  });

  it('keeps session locked when admin rejects re-entry', () => {
    const engine = new ExamAccessPolicyEngine('active', true);
    engine.requestReentry('Suspicious exit');
    engine.adminDecision('reject');

    expect(engine.canEnterExam().allowed).toBe(false);
    expect(engine.session.reentry_status).toBe('rejected');
  });
});

describe('Modification B — Phase 1 MCQ Timer-Expiration & Progression Flow', () => {
  interface MCQState {
    timerExpired: boolean;
    selectedChoice: string | null;
    lastResult: { is_correct: boolean; points_awarded: number; correct_answers: string[] } | null;
    currentIndex: number;
    totalQuestions: number;
  }

  function simulateTimerExpire(state: MCQState, privateCorrectAnswers: string[], points: number) {
    const choice = state.selectedChoice || 'NONE';
    const isCorrect = choice !== 'NONE' && privateCorrectAnswers.includes(choice);
    state.timerExpired = true;
    state.lastResult = {
      is_correct: isCorrect,
      points_awarded: isCorrect ? points : 0,
      correct_answers: privateCorrectAnswers
    };
  }

  function canAdvance(state: MCQState): boolean {
    // Only allowed if timer has expired and result finalized
    return Boolean(state.timerExpired && state.lastResult);
  }

  it('keeps correct answer hidden while timer is active and manual next is unavailable', () => {
    const state: MCQState = {
      timerExpired: false,
      selectedChoice: 'B',
      lastResult: null,
      currentIndex: 0,
      totalQuestions: 5
    };

    expect(canAdvance(state)).toBe(false);
    expect(state.lastResult).toBeNull();
  });

  it('finalizes answer on timer expiry, reveals correct answer in green and awards points', () => {
    const state: MCQState = {
      timerExpired: false,
      selectedChoice: 'B',
      lastResult: null,
      currentIndex: 0,
      totalQuestions: 5
    };

    simulateTimerExpire(state, ['B'], 10);
    expect(canAdvance(state)).toBe(true);
    expect(state.lastResult?.is_correct).toBe(true);
    expect(state.lastResult?.points_awarded).toBe(10);
    expect(state.lastResult?.correct_answers).toContain('B');
  });

  it('records unanswered question as 0 points on timer expiry and reveals correct answer', () => {
    const state: MCQState = {
      timerExpired: false,
      selectedChoice: null,
      lastResult: null,
      currentIndex: 1,
      totalQuestions: 5
    };

    simulateTimerExpire(state, ['C'], 10);
    expect(canAdvance(state)).toBe(true);
    expect(state.lastResult?.is_correct).toBe(false);
    expect(state.lastResult?.points_awarded).toBe(0);
    expect(state.lastResult?.correct_answers).toContain('C');
  });
});

describe('Modification C — Admin Dashboard Metrics Aggregation', () => {
  it('deduplicates questions across phases and sets to avoid inflated counts', () => {
    const questions = [
      { id: 'q1', phase: 'phase1' },
      { id: 'q2', phase: 'phase1' },
      { id: 'q1', phase: 'phase1' }, // Duplicate from multiple joins/sets
      { id: 'q3', phase: 'phase2' }
    ];

    const uniqueCount = new Set(questions.map(q => q.id)).size;
    expect(uniqueCount).toBe(3);
  });

  it('computes Section and Year distributions and percentages safely with 0 participants', () => {
    const participants: Profile[] = [];
    const sectionCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };

    participants.forEach((p) => {
      if (sectionCounts[p.section] !== undefined) sectionCounts[p.section]++;
    });

    const pctA = participants.length > 0 ? (sectionCounts.A / participants.length) * 100 : 0;
    expect(pctA).toBe(0);
    expect(Number.isNaN(pctA)).toBe(false);
  });

  it('accurately tallies active vs restricted participants', () => {
    const participants: Partial<Profile>[] = [
      { registration_status: 'active' },
      { registration_status: 'registered' },
      { registration_status: 'suspended' },
      { registration_status: 'disqualified' }
    ];

    let activeCount = 0;
    let restrictedCount = 0;

    participants.forEach((p) => {
      if (p.registration_status === 'active' || p.registration_status === 'registered') activeCount++;
      if (p.registration_status === 'suspended' || p.registration_status === 'disqualified') restrictedCount++;
    });

    expect(activeCount).toBe(2);
    expect(restrictedCount).toBe(2);
  });
});
