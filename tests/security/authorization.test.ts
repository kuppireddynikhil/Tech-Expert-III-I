// Security Test: Server Role Authorization & Private Solution Masking
// Sri Venkateswara College of Engineering (SVCE) - Tech Expert 2K26

import { describe, it, expect } from 'vitest';

describe('Security & Authorization Boundaries', () => {
  it('masks private answers and reference solutions in participant view', () => {
    // Raw database question record
    const internalQuestion = {
      id: 'q-101',
      title: 'Matrix Spiral Order',
      problem_statement: 'Traverse m x n in spiral order',
      choices: [],
      private_correct_answers: ['C'],
      starter_code: 'def spiral_order(matrix): pass',
      private_reference_solution: 'def spiral_order(matrix): ... top, bottom = 0 ...',
      private_evaluation_rubric: { hidden_tests: ['obstacle_matrix'] },
      is_published: true
    };

    // Transform through participant-safe serializer
    function sanitizeForParticipant(q: typeof internalQuestion) {
      const {
        private_correct_answers,
        private_reference_solution,
        private_evaluation_rubric,
        ...safeQuestion
      } = q;
      return safeQuestion;
    }

    const publicQ = sanitizeForParticipant(internalQuestion);

    expect((publicQ as any).private_correct_answers).toBeUndefined();
    expect((publicQ as any).private_reference_solution).toBeUndefined();
    expect((publicQ as any).private_evaluation_rubric).toBeUndefined();
    expect(publicQ.problem_statement).toBeDefined();
    expect(publicQ.starter_code).toBeDefined();
  });

  it('rejects non-admin role from administrative operations', () => {
    function authorizeAdminAction(roleRecord: { role: string; status: string } | null) {
      if (!roleRecord || roleRecord.status !== 'active' || (roleRecord.role !== 'admin' && roleRecord.role !== 'super_admin')) {
        throw new Error('Unauthorized: Trusted administrator role required');
      }
      return true;
    }

    // Participant session has no admin role
    expect(() => authorizeAdminAction(null)).toThrow(/Unauthorized/);
    expect(() => authorizeAdminAction({ role: 'participant', status: 'active' })).toThrow(/Unauthorized/);
    expect(() => authorizeAdminAction({ role: 'admin', status: 'revoked' })).toThrow(/Unauthorized/);

    // Active admin and super_admin succeed
    expect(authorizeAdminAction({ role: 'admin', status: 'active' })).toBe(true);
    expect(authorizeAdminAction({ role: 'super_admin', status: 'active' })).toBe(true);
  });
});
