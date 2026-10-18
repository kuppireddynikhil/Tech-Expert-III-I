// Unit Test: Custom Timer Inheritance Precedence
// Tests: Question-level timer -> Question-set default timer -> Phase-level default timer

import { describe, it, expect } from 'vitest';

function resolveEffectiveTimer(params: {
  questionTimerOverride?: number | null;
  setTimerOverride?: number | null;
  phaseDefaultTimer: number;
}): number {
  // 1. Question item override in set
  if (params.questionTimerOverride !== undefined && params.questionTimerOverride !== null && params.questionTimerOverride > 0) {
    return params.questionTimerOverride;
  }
  // 2. Question set default timer
  if (params.setTimerOverride !== undefined && params.setTimerOverride !== null && params.setTimerOverride > 0) {
    return params.setTimerOverride;
  }
  // 3. Phase default timer
  return params.phaseDefaultTimer || 15;
}

describe('Timer Inheritance Precedence', () => {
  it('gives highest precedence to explicit question-level override', () => {
    const timer = resolveEffectiveTimer({
      questionTimerOverride: 30,
      setTimerOverride: 20,
      phaseDefaultTimer: 15
    });
    expect(timer).toBe(30);
  });

  it('falls back to question-set default when question has no override', () => {
    const timer = resolveEffectiveTimer({
      questionTimerOverride: null,
      setTimerOverride: 25,
      phaseDefaultTimer: 15
    });
    expect(timer).toBe(25);
  });

  it('falls back to phase-level default when neither question nor set has override', () => {
    const timer = resolveEffectiveTimer({
      questionTimerOverride: null,
      setTimerOverride: null,
      phaseDefaultTimer: 18
    });
    expect(timer).toBe(18);
  });
});
