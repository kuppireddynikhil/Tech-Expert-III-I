// Unit Test: Phase 3 Attempt Counting and Permanent Lock Engine
// Tests: Max 3 attempts, permanent locking on 3 failures, acceptance on attempt 3

import { describe, it, expect } from 'vitest';

class AttemptTracker {
  attemptsUsed = 0;
  isSolved = false;
  isLocked = false;

  submitAttempt(isAccepted: boolean): { success: boolean; attemptsUsed: number; isLocked: boolean; isSolved: boolean } {
    if (this.isLocked) {
      throw new Error('Program is permanently locked after 3 unsuccessful attempts');
    }
    if (this.isSolved) {
      throw new Error('Program has already been successfully solved');
    }

    this.attemptsUsed += 1;

    if (isAccepted) {
      this.isSolved = true;
      this.isLocked = false;
    } else {
      if (this.attemptsUsed >= 3) {
        this.isLocked = true;
      }
    }

    return {
      success: true,
      attemptsUsed: this.attemptsUsed,
      isLocked: this.isLocked,
      isSolved: this.isSolved
    };
  }
}

describe('Phase 3 3-Attempt Permanent Lock Engine', () => {
  it('allows submissions on attempt 1 and 2 without locking', () => {
    const tracker = new AttemptTracker();

    const res1 = tracker.submitAttempt(false);
    expect(res1.attemptsUsed).toBe(1);
    expect(res1.isLocked).toBe(false);

    const res2 = tracker.submitAttempt(false);
    expect(res2.attemptsUsed).toBe(2);
    expect(res2.isLocked).toBe(false);
  });

  it('permanently locks program on third unsuccessful attempt and blocks fourth attempt', () => {
    const tracker = new AttemptTracker();

    tracker.submitAttempt(false);
    tracker.submitAttempt(false);
    const res3 = tracker.submitAttempt(false);

    expect(res3.attemptsUsed).toBe(3);
    expect(res3.isLocked).toBe(true);
    expect(res3.isSolved).toBe(false);

    // 4th attempt must be strictly rejected
    expect(() => tracker.submitAttempt(false)).toThrow(/Program is permanently locked/);
  });

  it('accepts valid solution on attempt 3 without locking', () => {
    const tracker = new AttemptTracker();

    tracker.submitAttempt(false);
    tracker.submitAttempt(false);
    const res3 = tracker.submitAttempt(true); // Solved on attempt 3!

    expect(res3.attemptsUsed).toBe(3);
    expect(res3.isSolved).toBe(true);
    expect(res3.isLocked).toBe(false);
  });
});
