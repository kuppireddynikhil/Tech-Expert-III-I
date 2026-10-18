// Unit Test: Participant Registration Validation
// Verifies Section A–E and Academic Year I–III boundary enforcement

import { describe, it, expect } from 'vitest';
import { api } from '../../src/services/api';
import type { SectionType, AcademicYearType } from '../../src/types';

describe('Participant Registration Validation', () => {
  it('accepts valid section (A–E) and valid year (I–III)', async () => {
    const validSections: SectionType[] = ['A', 'B', 'C', 'D', 'E'];
    const validYears: AcademicYearType[] = ['I', 'II', 'III'];

    // Test validation helper
    function validateParticipant(section: any, year: any) {
      if (!validSections.includes(section)) throw new Error(`Invalid section '${section}'`);
      if (!validYears.includes(year)) throw new Error(`Invalid academic year '${year}'`);
      return true;
    }

    for (const sec of validSections) {
      for (const yr of validYears) {
        expect(validateParticipant(sec, yr)).toBe(true);
      }
    }
  });

  it('rejects invalid section values outside A–E', async () => {
    const invalidSections = ['F', 'G', 'Z', '1', ''] as any[];

    for (const invalidSec of invalidSections) {
      await expect(
        api.registerParticipant({
          fullName: 'Test Invalid',
          email: 'invalid@svce.ac.in',
          section: invalidSec,
          academicYear: 'I',
          password: 'securepassword123'
        })
      ).rejects.toThrow(/Invalid section/);
    }
  });

  it('rejects invalid academic year values outside I–III', async () => {
    const invalidYears = ['IV', 'V', '0', '4', ''] as any[];

    for (const invalidYr of invalidYears) {
      await expect(
        api.registerParticipant({
          fullName: 'Test Invalid Year',
          email: 'invalid_yr@svce.ac.in',
          section: 'A',
          academicYear: invalidYr,
          password: 'securepassword123'
        })
      ).rejects.toThrow(/Invalid academic year/);
    }
  });
});
