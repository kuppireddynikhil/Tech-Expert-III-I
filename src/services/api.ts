// TECH EXPERT 2K26 — MASTER API & DATA SERVICE
// Sri Venkateswara College of Engineering (SVCE)

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Profile,
  CompetitionSettings,
  PhaseControl,
  Question,
  QuestionSet,
  QuestionSetAssignment,
  LeaderboardEntry,
  PhaseLeaderboardEntry,
  ArchivedPhaseRun,
  RunResult,
  AdminAuditLog,
  SectionType,
  AcademicYearType,
  PhaseId,
  CompetitionSession,
  QuizResponse,
  AdvancementCandidate,
  AdvancementTarget
} from '../types';

// Mock state fallback when Supabase is not configured (allows immediate local preview)
let mockQuestions: Question[] = [];
let mockQuestionSets: QuestionSet[] = [];
let mockSessions: Record<string, CompetitionSession> = {};
let mockQuizResponses: Record<string, QuizResponse[]> = {};
let mockSettings: CompetitionSettings = {
  id: 'svce_2k26',
  event_name: 'Tech Expert 2K26',
  current_phase: 'phase1',
  event_status: 'active',
  leaderboard_visible: true,
  updated_at: new Date().toISOString()
};

let mockPhaseControls: Record<string, PhaseControl> = {
  phase1: {
    phase: 'phase1',
    title: 'Phase 1: Python Quick Quiz',
    status: 'draft',
    is_activated: false,
    exam_started_at: null,
    current_run_number: 1,
    active_question_set_id: null,
    default_question_timer: 15,
    total_deadline_minutes: 0,
    qualification_limit: 15,
    randomize_questions: false,
    updated_at: new Date().toISOString()
  },
  phase2: {
    phase: 'phase2',
    title: 'Phase 2: Python Debugging Challenge',
    status: 'draft',
    is_activated: false,
    exam_started_at: null,
    current_run_number: 1,
    active_question_set_id: null,
    default_question_timer: 0,
    total_deadline_minutes: 15,
    qualification_limit: 5,
    randomize_questions: false,
    updated_at: new Date().toISOString()
  },
  phase3: {
    phase: 'phase3',
    title: 'Phase 3: Python Logic Builder',
    status: 'draft',
    is_activated: false,
    exam_started_at: null,
    current_run_number: 1,
    active_question_set_id: null,
    default_question_timer: 0,
    total_deadline_minutes: 0,
    qualification_limit: 2,
    randomize_questions: false,
    updated_at: new Date().toISOString()
  }
};

let mockArchivedRuns: ArchivedPhaseRun[] = [];
let mockAuditLogs: AdminAuditLog[] = [];

export const api = {
  // --------------------------------------------------------------------------
  // Competition Settings & Phase Controls
  // --------------------------------------------------------------------------
  async getCompetitionSettings(): Promise<CompetitionSettings> {
    if (!isSupabaseConfigured) return mockSettings;

    const { data, error } = await supabase
      .from('competition_settings')
      .select('*')
      .eq('id', 'svce_2k26')
      .single();

    if (error || !data) {
      console.warn('Failed to load competition settings from DB, using defaults');
      return mockSettings;
    }
    return data as CompetitionSettings;
  },

  async updateCompetitionSettings(updates: Partial<CompetitionSettings>, adminReason?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockSettings = { ...mockSettings, ...updates };
      return;
    }

    const { error } = await supabase
      .from('competition_settings')
      .update(updates)
      .eq('id', 'svce_2k26');

    if (error) throw error;

    await this.logAdminAction('UPDATE_EVENT_SETTINGS', 'competition_settings', 'svce_2k26', JSON.stringify(updates), adminReason);
  },

  async getPhaseControls(): Promise<Record<PhaseId, PhaseControl>> {
    if (!isSupabaseConfigured) return mockPhaseControls as Record<PhaseId, PhaseControl>;

    const { data, error } = await supabase
      .from('phase_controls')
      .select('*');

    if (error || !data || data.length === 0) return mockPhaseControls as Record<PhaseId, PhaseControl>;

    const map = {} as Record<PhaseId, PhaseControl>;
    data.forEach((p: any) => {
      const rules = p.scoring_rules || {};
      const isActivated = p.is_activated !== undefined
        ? Boolean(p.is_activated)
        : Boolean(rules.is_activated !== undefined ? rules.is_activated : p.status === 'active');
      const examStartedAt = p.exam_started_at !== undefined
        ? p.exam_started_at
        : (rules.exam_started_at || null);
      const runNumber = p.current_run_number || rules.current_run_number || 1;
      const activeSetId = p.active_question_set_id || rules.active_question_set_id || null;
      const pausedAt = p.paused_at !== undefined ? p.paused_at : (rules.paused_at || null);
      const totalPausedSeconds = p.total_paused_seconds || rules.total_paused_seconds || 0;

      map[p.phase as PhaseId] = {
        ...p,
        is_activated: isActivated,
        exam_started_at: examStartedAt,
        current_run_number: runNumber,
        active_question_set_id: activeSetId,
        paused_at: pausedAt,
        total_paused_seconds: totalPausedSeconds
      };
    });
    return map;
  },

  async updatePhaseControl(phase: PhaseId, updates: Partial<PhaseControl>, adminReason?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockPhaseControls[phase] = { ...mockPhaseControls[phase], ...updates };
      return;
    }

    // Read current control so we preserve existing scoring_rules and handle pause arithmetic
    const { data: current } = await supabase
      .from('phase_controls')
      .select('*')
      .eq('phase', phase)
      .maybeSingle();

    const currentRules = (current?.scoring_rules || {}) as Record<string, any>;
    const newRules = {
      ...currentRules,
      ...(updates.scoring_rules || {})
    };

    if (updates.is_activated !== undefined) newRules.is_activated = updates.is_activated;
    if (updates.exam_started_at !== undefined) newRules.exam_started_at = updates.exam_started_at;
    if (updates.current_run_number !== undefined) newRules.current_run_number = updates.current_run_number;
    if (updates.active_question_set_id !== undefined) newRules.active_question_set_id = updates.active_question_set_id;

    const payload: any = {
      ...updates,
      scoring_rules: newRules,
      updated_at: new Date().toISOString()
    };

    // Authoritative Pause / Resume Arithmetic
    if (updates.status === 'paused') {
      const nowIso = new Date().toISOString();
      payload.paused_at = nowIso;
      newRules.paused_at = nowIso;
    } else if (updates.status === 'active' && current?.status === 'paused') {
      const pausedAt = current.paused_at || currentRules.paused_at;
      if (pausedAt) {
        const pauseElapsedMs = Math.max(0, Date.now() - new Date(pausedAt).getTime());
        if (current.exam_started_at) {
          const shiftedExamStart = new Date(new Date(current.exam_started_at).getTime() + pauseElapsedMs).toISOString();
          payload.exam_started_at = shiftedExamStart;
          newRules.exam_started_at = shiftedExamStart;
        }
        if (current.start_time) {
          const shiftedStartTime = new Date(new Date(current.start_time).getTime() + pauseElapsedMs).toISOString();
          payload.start_time = shiftedStartTime;
          newRules.start_time = shiftedStartTime;
        }
        const addedPausedSecs = Math.round(pauseElapsedMs / 1000);
        payload.total_paused_seconds = (current.total_paused_seconds || 0) + addedPausedSecs;
        newRules.total_paused_seconds = payload.total_paused_seconds;
      }
      payload.paused_at = null;
      newRules.paused_at = null;
    }

    // Attempt full update with top-level fields
    let { error } = await supabase
      .from('phase_controls')
      .update(payload)
      .eq('phase', phase);

    if (error) {
      console.warn('Top-level column notice on phase_controls, falling back to base fields with scoring_rules JSON:', error.message);
      delete payload.is_activated;
      delete payload.exam_started_at;
      delete payload.current_run_number;
      delete payload.active_question_set_id;
      delete payload.paused_at;
      delete payload.total_paused_seconds;

      const fallbackRes = await supabase
        .from('phase_controls')
        .update(payload)
        .eq('phase', phase);

      if (fallbackRes.error) throw fallbackRes.error;
    }

    await this.logAdminAction('UPDATE_PHASE_CONTROL', 'phase_controls', phase, JSON.stringify(updates), adminReason);
  },

  async activatePhase(phase: PhaseId, adminReason?: string): Promise<void> {
    const controls = await this.getPhaseControls();
    const current = controls[phase];
    const runNum = current?.current_run_number || 1;

    await this.updatePhaseControl(phase, {
      status: 'active',
      is_activated: true,
      exam_started_at: null,
      current_run_number: runNum
    }, adminReason || `Administrator activated ${phase.toUpperCase()} (Waiting room opened)`);

    await this.updateCompetitionSettings({
      current_phase: phase,
      event_status: 'active'
    }, `Activated ${phase.toUpperCase()}`);

    await this.logAdminAction(
      'ACTIVATE_PHASE',
      'phase_controls',
      phase,
      `Phase ${phase.toUpperCase()} activated. Eligible participants may enter waiting room. Exam not started yet.`,
      adminReason
    );
  },

  async startExam(phase: PhaseId, adminReason?: string): Promise<{ started_at: string }> {
    const controls = await this.getPhaseControls();
    const current = controls[phase];

    if (!current?.is_activated && current?.status !== 'active') {
      throw new Error(`Cannot start exam: ${phase.toUpperCase()} has not been activated yet. Please activate the phase first.`);
    }

    if (current?.exam_started_at) {
      throw new Error(`Exam for ${phase.toUpperCase()} has already started at ${new Date(current.exam_started_at).toLocaleTimeString()}.`);
    }

    const now = new Date().toISOString();

    await this.updatePhaseControl(phase, {
      status: 'active',
      is_activated: true,
      exam_started_at: now,
      start_time: now
    }, adminReason || `Administrator started examination for ${phase.toUpperCase()}`);

    await this.logAdminAction(
      'START_EXAM',
      'phase_controls',
      phase,
      `Authoritative exam start recorded for ${phase.toUpperCase()} at ${now}. Participants in waiting room authorized to enter examination.`,
      adminReason
    );

    return { started_at: now };
  },

  async restartPhase(phase: PhaseId, questionSetId: string, adminReason?: string): Promise<{ newRunNumber: number }> {
    const controls = await this.getPhaseControls();
    const current = controls[phase];
    const currentRun = current?.current_run_number || 1;
    const nextRun = currentRun + 1;

    // 1. Snapshot previous run's leaderboard data before reset
    let previousLeaderboard: PhaseLeaderboardEntry[] = [];
    try {
      previousLeaderboard = await this.getPhaseLeaderboard(phase, currentRun);
    } catch (e) {
      console.warn('Could not snapshot previous leaderboard:', e);
    }

    // 2. Archive previous run record
    const archiveRecord: ArchivedPhaseRun = {
      id: crypto.randomUUID(),
      phase,
      run_number: currentRun,
      question_set_id: current?.active_question_set_id || undefined,
      archived_at: new Date().toISOString(),
      reason: adminReason || `Restarted to Run #${nextRun}`,
      leaderboard_data: previousLeaderboard
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('archived_phase_runs').insert({
          phase,
          run_number: currentRun,
          question_set_id: current?.active_question_set_id || null,
          leaderboard_data: previousLeaderboard,
          reason: adminReason || `Restarted to Run #${nextRun}`
        });
      } catch (archErr) {
        console.warn('Archived table insert notice (saved to audit metadata):', archErr);
      }
    } else {
      mockArchivedRuns.push(archiveRecord);
    }

    // 3. Reset active phase session and attempt states strictly for the selected phase
    if (isSupabaseConfigured) {
      // Archive or delete previous quiz responses for Phase 1
      if (phase === 'phase1') {
        const { data: sessList } = await supabase
          .from('competition_sessions')
          .select('id')
          .eq('phase', 'phase1');

        const sIds = (sessList || []).map(s => s.id);
        if (sIds.length > 0) {
          await supabase
            .from('quiz_responses')
            .delete()
            .in('session_id', sIds);
        }
      }

      // Reset program attempts strictly for Phase 2 / Phase 3
      if (phase === 'phase2' || phase === 'phase3') {
        await supabase
          .from('program_attempts')
          .delete()
          .eq('phase', phase);
      }

      // Reset active sessions for this phase
      await supabase
        .from('competition_sessions')
        .update({
          status: 'active',
          current_question_index: 0,
          current_question_started_at: new Date().toISOString(),
          final_score: 0,
          is_locked: false,
          reentry_status: 'none',
          reentry_reason: null,
          assigned_set_id: questionSetId,
          started_at: new Date().toISOString(),
          ended_at: null
        })
        .eq('phase', phase);

      // Deactivate any existing 'all' assignment for this phase and assign selected set
      await supabase
        .from('question_set_assignments')
        .update({ is_active: false })
        .eq('target_type', 'all');

      await supabase
        .from('question_set_assignments')
        .insert({
          set_id: questionSetId,
          target_type: 'all',
          target_value: 'all',
          is_active: true
        });
    } else {
      if (phase === 'phase1') {
        mockQuizResponses = {};
      }
      Object.values(mockSessions).forEach(s => {
        if (s.phase === phase) {
          s.status = 'active';
          s.current_question_index = 0;
          s.final_score = 0;
          s.is_locked = false;
          s.reentry_status = 'none';
          s.assigned_set_id = questionSetId;
        }
      });
    }

    // 4. Update phase_controls: place back in Waiting Room (is_activated: true, exam_started_at: null)
    await this.updatePhaseControl(phase, {
      status: 'active',
      is_activated: true,
      exam_started_at: null, // EXAM IS NOT STARTED! Participants in Waiting Room!
      start_time: undefined,
      end_time: undefined,
      current_run_number: nextRun,
      active_question_set_id: questionSetId
    }, `Restarted ${phase.toUpperCase()} to Run #${nextRun}`);

    // 5. Authoritative Audit Log
    await this.logAdminAction(
      'PHASE_RESTART',
      'phase_controls',
      phase,
      `Phase ${phase.toUpperCase()} restarted. Run #${currentRun} archived -> Run #${nextRun} created with question set ${questionSetId}. Participants in Waiting Room.`,
      adminReason
    );

    return { newRunNumber: nextRun };
  },

  async endPhaseForEveryone(phase: PhaseId, adminReason?: string): Promise<{ affectedSessions: number }> {
    if (!isSupabaseConfigured) {
      mockPhaseControls[phase] = { ...mockPhaseControls[phase], status: 'closed' };
      let count = 0;
      Object.values(mockSessions).forEach(s => {
        if (s.phase === phase && s.status === 'active') {
          s.status = 'completed';
          s.is_locked = true;
          s.ended_at = new Date().toISOString();
          count++;
        }
      });
      return { affectedSessions: count };
    }

    const nowIso = new Date().toISOString();

    // 1. Update phase_controls to 'closed'
    const { error: phaseError } = await supabase
      .from('phase_controls')
      .update({ status: 'closed', updated_at: nowIso })
      .eq('phase', phase);

    if (phaseError) throw phaseError;

    // 2. Fetch all active sessions for this phase
    const { data: openSessions, error: sessionsError } = await supabase
      .from('competition_sessions')
      .select('id, participant_id')
      .eq('phase', phase)
      .eq('status', 'active');

    if (sessionsError) console.warn('Error fetching active sessions to close:', sessionsError);

    let affectedCount = 0;

    if (openSessions && openSessions.length > 0) {
      affectedCount = openSessions.length;
      const sessionIds = openSessions.map(s => s.id);

      if (phase === 'phase1') {
        // Calculate score from recorded quiz responses
        const { data: responses } = await supabase
          .from('quiz_responses')
          .select('session_id, points_awarded')
          .in('session_id', sessionIds);

        const scoreMap: Record<string, number> = {};
        (responses || []).forEach(r => {
          scoreMap[r.session_id] = (scoreMap[r.session_id] || 0) + (r.points_awarded || 0);
        });

        for (const session of openSessions) {
          const finalScore = scoreMap[session.id] || 0;
          await supabase
            .from('competition_sessions')
            .update({
              status: 'completed',
              is_locked: true,
              ended_at: nowIso,
              final_score: finalScore,
              reentry_status: 'rejected',
              reentry_reason: 'Phase concluded and locked by administrator.'
            })
            .eq('id', session.id);
        }
      } else {
        // Phase 2 or Phase 3: compute score from solved program_attempts
        const { data: attempts } = await supabase
          .from('program_attempts')
          .select('participant_id, question_id, is_solved')
          .eq('phase', phase)
          .eq('is_solved', true);

        const { data: qs } = await supabase
          .from('questions')
          .select('id, scoring_points')
          .eq('phase', phase);

        const qPointMap: Record<string, number> = {};
        (qs || []).forEach(q => { qPointMap[q.id] = q.scoring_points || 0; });

        const userScoreMap: Record<string, number> = {};
        (attempts || []).forEach(a => {
          userScoreMap[a.participant_id] = (userScoreMap[a.participant_id] || 0) + (qPointMap[a.question_id] || 0);
        });

        for (const session of openSessions) {
          const finalScore = userScoreMap[session.participant_id] || 0;
          await supabase
            .from('competition_sessions')
            .update({
              status: 'completed',
              is_locked: true,
              ended_at: nowIso,
              final_score: finalScore,
              reentry_status: 'rejected',
              reentry_reason: 'Phase concluded and locked by administrator.'
            })
            .eq('id', session.id);
        }

        // Lock all program attempts for this phase
        await supabase
          .from('program_attempts')
          .update({ is_locked: true })
          .eq('phase', phase);
      }
    }

    // 3. Log admin action
    await this.logAdminAction(
      'FORCE_END_PHASE',
      'phase_controls',
      phase,
      `Phase ${phase.toUpperCase()} was ended for all participants. ${affectedCount} active sessions finalized and locked.`,
      adminReason || 'Administrator ended phase'
    );

    return { affectedSessions: affectedCount };
  },

  // --------------------------------------------------------------------------
  // Question Bank
  // --------------------------------------------------------------------------
  async getQuestions(phase?: PhaseId): Promise<Question[]> {
    if (!isSupabaseConfigured) {
      return phase ? mockQuestions.filter(q => q.phase === phase && !q.is_archived) : mockQuestions.filter(q => !q.is_archived);
    }

    let query = supabase
      .from('questions')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (phase) {
      query = query.eq('phase', phase);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Question[];
  },

  async getQuestionById(id: string): Promise<Question | null> {
    if (!isSupabaseConfigured) {
      return mockQuestions.find(q => q.id === id) || null;
    }

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Question;
  },

  async createQuestion(question: Omit<Question, 'id' | 'created_at' | 'updated_at' | 'version'>): Promise<Question> {
    if (!isSupabaseConfigured) {
      const newQ: Question = {
        ...question,
        id: crypto.randomUUID(),
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockQuestions.unshift(newQ);
      return newQ;
    }

    const { data, error } = await supabase
      .from('questions')
      .insert(question)
      .select()
      .single();

    if (error) throw error;

    await this.logAdminAction('CREATE_QUESTION', 'questions', data.id, `Created question: ${data.title}`);
    return data as Question;
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    if (!isSupabaseConfigured) {
      const idx = mockQuestions.findIndex(q => q.id === id);
      if (idx !== -1) {
        mockQuestions[idx] = { ...mockQuestions[idx], ...updates, updated_at: new Date().toISOString() };
        return mockQuestions[idx];
      }
      throw new Error('Question not found');
    }

    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await this.logAdminAction('UPDATE_QUESTION', 'questions', id, `Updated question: ${data.title}`);
    return data as Question;
  },

  async duplicateQuestion(id: string): Promise<Question> {
    const original = await this.getQuestionById(id);
    if (!original) throw new Error('Original question not found');

    const copyData = {
      phase: original.phase,
      question_type: original.question_type,
      title: `${original.title} (Copy)`,
      problem_statement: original.problem_statement,
      choices: original.choices,
      private_correct_answers: original.private_correct_answers,
      starter_code: original.starter_code,
      private_reference_solution: original.private_reference_solution,
      private_evaluation_rubric: original.private_evaluation_rubric,
      scoring_points: original.scoring_points,
      custom_timer: original.custom_timer,
      difficulty: original.difficulty,
      tags: original.tags,
      is_published: false,
      is_archived: false
    };

    return this.createQuestion(copyData);
  },

  async archiveQuestion(id: string, reason?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const q = mockQuestions.find(x => x.id === id);
      if (q) q.is_archived = true;
      return;
    }

    const { error } = await supabase
      .from('questions')
      .update({ is_archived: true, is_published: false })
      .eq('id', id);

    if (error) throw error;

    await this.logAdminAction('ARCHIVE_QUESTION', 'questions', id, 'Archived question to preserve history', reason);
  },

  // --------------------------------------------------------------------------
  // Question Sets & Ordering
  // --------------------------------------------------------------------------
  async getQuestionSets(phase?: PhaseId): Promise<QuestionSet[]> {
    if (!isSupabaseConfigured) {
      return phase ? mockQuestionSets.filter(s => s.phase === phase && !s.is_archived) : mockQuestionSets.filter(s => !s.is_archived);
    }

    let query = supabase
      .from('question_sets')
      .select(`
        *,
        items:question_set_items(
          id, set_id, question_id, display_order, timer_override,
          question:questions(*)
        )
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: true });

    if (phase) {
      query = query.eq('phase', phase);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as QuestionSet[];
  },

  async createQuestionSet(set: Omit<QuestionSet, 'id' | 'created_at' | 'updated_at'>): Promise<QuestionSet> {
    if (!isSupabaseConfigured) {
      const newSet: QuestionSet = {
        ...set,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: []
      };
      mockQuestionSets.push(newSet);
      return newSet;
    }

    const { data, error } = await supabase
      .from('question_sets')
      .insert(set)
      .select()
      .single();

    if (error) throw error;

    await this.logAdminAction('CREATE_QUESTION_SET', 'question_sets', data.id, `Created question set: ${data.set_name}`);
    return data as QuestionSet;
  },

  async updateQuestionSet(id: string, updates: Partial<QuestionSet>): Promise<void> {
    if (!isSupabaseConfigured) {
      const s = mockQuestionSets.find(x => x.id === id);
      if (s) Object.assign(s, updates);
      return;
    }

    const { error } = await supabase
      .from('question_sets')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    await this.logAdminAction('UPDATE_QUESTION_SET', 'question_sets', id, JSON.stringify(updates));
  },

  async updateQuestionSetItems(
    setId: string,
    items: Array<{ question_id: string; display_order: number; timer_override?: number | null }>
  ): Promise<void> {
    if (!isSupabaseConfigured) return;

    // Delete existing items for set
    await supabase.from('question_set_items').delete().eq('set_id', setId);

    if (items.length > 0) {
      const payload = items.map(item => ({
        set_id: setId,
        question_id: item.question_id,
        display_order: item.display_order,
        timer_override: item.timer_override || null
      }));

      const { error } = await supabase.from('question_set_items').insert(payload);
      if (error) throw error;
    }

    await this.logAdminAction('REORDER_QUESTION_SET', 'question_sets', setId, `Updated ${items.length} question set items`);
  },

  // --------------------------------------------------------------------------
  // Question Set Assignments
  // --------------------------------------------------------------------------
  async getAssignments(): Promise<QuestionSetAssignment[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('question_set_assignments')
      .select(`
        *,
        question_sets ( set_name )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((a: any) => ({
      ...a,
      set_name: a.question_sets?.set_name
    })) as QuestionSetAssignment[];
  },

  async assignQuestionSet(
    setId: string,
    targetType: 'all' | 'section' | 'academic_year' | 'section_year' | 'participant',
    targetValue: string
  ): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('question_set_assignments')
      .insert({
        set_id: setId,
        target_type: targetType,
        target_value: targetValue,
        is_active: true
      });

    if (error) throw error;

    await this.logAdminAction('ASSIGN_QUESTION_SET', 'question_set_assignments', setId, `Assigned to ${targetType}: ${targetValue}`);
  },

  // --------------------------------------------------------------------------
  // Participant & Registration
  // --------------------------------------------------------------------------
  async registerParticipant(data: {
    fullName: string;
    email: string;
    collegeId?: string;
    section: SectionType;
    academicYear: AcademicYearType;
    password: string;
  }): Promise<{ user: any; profile: Profile }> {
    // Validate Section and Academic Year strictly
    const validSections: SectionType[] = ['A', 'B', 'C', 'D', 'E'];
    const validYears: AcademicYearType[] = ['I', 'II', 'III'];

    if (!validSections.includes(data.section)) {
      throw new Error(`Invalid section '${data.section}'. Allowed sections are: A, B, C, D, E.`);
    }

    if (!validYears.includes(data.academicYear)) {
      throw new Error(`Invalid academic year '${data.academicYear}'. Allowed years are: I, II, III.`);
    }

    if (!isSupabaseConfigured) {
      const mockUser = { id: crypto.randomUUID(), email: data.email };
      const mockProf: Profile = {
        user_id: mockUser.id,
        full_name: data.fullName,
        email: data.email,
        college_id: data.collegeId,
        section: data.section,
        academic_year: data.academicYear,
        registration_status: 'registered',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return { user: mockUser, profile: mockProf };
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          college_id: data.collegeId,
          section: data.section,
          academic_year: data.academicYear
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registration failed. Please try again.');

    // Upsert Profile directly to guarantee immediate synchronization
    const { data: profData, error: profError } = await supabase
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        full_name: data.fullName,
        email: data.email,
        college_id: data.collegeId,
        section: data.section,
        academic_year: data.academicYear,
        registration_status: 'registered'
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (profError) {
      console.warn('Profile sync notice:', profError);
    }

    return {
      user: authData.user,
      profile: (profData || {
        user_id: authData.user.id,
        full_name: data.fullName,
        email: data.email,
        college_id: data.collegeId,
        section: data.section,
        academic_year: data.academicYear,
        registration_status: 'registered',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }) as Profile
    };
  },

  async getParticipants(): Promise<Profile[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Profile[];
  },

  async updateParticipantStatus(userId: string, status: Profile['registration_status'], reason?: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('profiles')
      .update({ registration_status: status })
      .eq('user_id', userId);

    if (error) throw error;

    await this.logAdminAction('UPDATE_PARTICIPANT_STATUS', 'profiles', userId, `Status changed to ${status}`, reason);
  },

  async activateParticipants(userIds: string[], reason?: string): Promise<number> {
    if (!isSupabaseConfigured || userIds.length === 0) return 0;

    const { data, error } = await supabase
      .from('profiles')
      .update({ registration_status: 'active' })
      .in('user_id', userIds)
      .select('user_id');

    if (error) throw error;

    const count = data?.length ?? 0;
    await this.logAdminAction('ACTIVATE_ALL_PARTICIPANTS', 'profiles', 'bulk', `Activated ${count} participant(s)`, reason);
    return count;
  },

  // --------------------------------------------------------------------------
  // Phase Advancement (administrator decides who moves to the next phase)
  // --------------------------------------------------------------------------
  async getAdvancementCandidates(target: AdvancementTarget): Promise<{
    candidates: AdvancementCandidate[];
    published: boolean;
    sourceReady: boolean;
  }> {
    if (!isSupabaseConfigured) return { candidates: [], published: false, sourceReady: true };

    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, section, academic_year, registration_status')
      .eq('registration_status', 'active');
    if (pErr) throw pErr;

    const { data: existing } = await supabase
      .from('phase_qualifications')
      .select('participant_id, qualified')
      .eq('phase', target);
    const published = (existing?.length ?? 0) > 0;
    const selectedSet = new Set((existing || []).filter(e => e.qualified).map(e => e.participant_id));

    let eligibleIds: Set<string> | null = null;
    let sourceReady = true;
    const score = new Map<string, number>();
    const tie = new Map<string, number>();
    const detail = new Map<string, string>();

    if (target === 'phase2') {
      const { data: responses } = await supabase
        .from('quiz_responses')
        .select('participant_id, points_awarded, is_correct');
      const { data: sessions } = await supabase
        .from('competition_sessions')
        .select('participant_id, started_at, ended_at, status')
        .eq('phase', 'phase1');

      const correct = new Map<string, number>();
      (responses || []).forEach(r => {
        score.set(r.participant_id, (score.get(r.participant_id) || 0) + (r.points_awarded || 0));
        if (r.is_correct) correct.set(r.participant_id, (correct.get(r.participant_id) || 0) + 1);
      });
      (sessions || []).forEach(sn => {
        const dur = sn.ended_at ? new Date(sn.ended_at).getTime() - new Date(sn.started_at).getTime() : Number.MAX_SAFE_INTEGER;
        tie.set(sn.participant_id, dur);
      });
      correct.forEach((c, id) => detail.set(id, `${c} correct`));
      eligibleIds = new Set((sessions || []).map(sn => sn.participant_id));
    } else {
      const { data: p2Quals } = await supabase
        .from('phase_qualifications')
        .select('participant_id')
        .eq('phase', 'phase2')
        .eq('qualified', true);
      sourceReady = (p2Quals?.length ?? 0) > 0;
      eligibleIds = new Set((p2Quals || []).map(q => q.participant_id));

      const { data: attempts } = await supabase
        .from('program_attempts')
        .select('participant_id, is_solved, solved_at, attempts_used')
        .eq('phase', 'phase2');
      const solved = new Map<string, number>();
      (attempts || []).forEach(a => {
        if (a.is_solved) {
          solved.set(a.participant_id, (solved.get(a.participant_id) || 0) + 1);
          score.set(a.participant_id, (score.get(a.participant_id) || 0) + 30);
          const t = a.solved_at ? new Date(a.solved_at).getTime() : Number.MAX_SAFE_INTEGER;
          tie.set(a.participant_id, Math.max(tie.get(a.participant_id) || 0, t));
        }
      });
      solved.forEach((c, id) => detail.set(id, `${c} program(s) solved`));
    }

    const list: AdvancementCandidate[] = (profiles || [])
      .filter(p => !eligibleIds || eligibleIds.has(p.user_id))
      .map(p => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        section: p.section as SectionType,
        academic_year: p.academic_year as AcademicYearType,
        score: score.get(p.user_id) || 0,
        detail: detail.get(p.user_id) || '—',
        tie_break: tie.get(p.user_id) ?? Number.MAX_SAFE_INTEGER,
        rank: 0,
        selected: selectedSet.has(p.user_id)
      }));

    list.sort((a, b) =>
      b.score - a.score || a.tie_break - b.tie_break || a.full_name.localeCompare(b.full_name)
    );
    list.forEach((c, i) => { c.rank = i + 1; });

    return { candidates: list, published, sourceReady };
  },

  async publishAdvancement(
    target: AdvancementTarget,
    all: AdvancementCandidate[],
    selectedIds: string[],
    limit: number
  ): Promise<void> {
    if (!isSupabaseConfigured) return;
    const chosen = new Set(selectedIds);

    const { error: delErr } = await supabase.from('phase_qualifications').delete().eq('phase', target);
    if (delErr) throw delErr;

    const rows = all.map(c => ({
      phase: target,
      participant_id: c.user_id,
      qualified: chosen.has(c.user_id),
      rank: c.rank,
      score: c.score
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from('phase_qualifications').insert(rows);
      if (error) throw error;
    }

    const sourcePhase: PhaseId = target === 'phase2' ? 'phase1' : 'phase2';
    await supabase.from('phase_controls').update({ qualification_limit: limit }).eq('phase', sourcePhase);

    await this.logAdminAction(
      'PUBLISH_ADVANCEMENT', 'phase_qualifications', target,
      `${chosen.size} participant(s) advanced to ${target}`, `Advancement limit ${limit}`
    );
  },

  async clearAdvancement(target: AdvancementTarget): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('phase_qualifications').delete().eq('phase', target);
    if (error) throw error;
    await this.logAdminAction('CLEAR_ADVANCEMENT', 'phase_qualifications', target, `Advancement list for ${target} withdrawn`);
  },

  /** 'qualified' | 'not_published' | 'not_qualified' for the logged-in participant */
  async getMyQualification(phase: AdvancementTarget): Promise<'qualified' | 'not_published' | 'not_qualified'> {
    if (!isSupabaseConfigured) return 'qualified';
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) return 'not_qualified';

    const { data: published } = await supabase.rpc('phase_qualification_published', { p_phase: phase });
    if (!published) return 'not_published';

    const { data } = await supabase
      .from('phase_qualifications')
      .select('qualified')
      .eq('phase', phase)
      .eq('participant_id', uid)
      .maybeSingle();
    return data?.qualified ? 'qualified' : 'not_qualified';
  },

  // --------------------------------------------------------------------------
  // Competition Submissions & Participant View
  // --------------------------------------------------------------------------
  async getParticipantAssignedSet(phase: PhaseId): Promise<{
    set_id: string;
    set_name: string;
    description: string;
    default_timer: number;
    timer_policy: string;
    questions: Question[];
  }> {
    if (!isSupabaseConfigured) {
      // Fallback: return mock questions for this phase
      const qs = mockQuestions.filter(q => q.phase === phase && q.is_published);
      return {
        set_id: 'mock-set-id',
        set_name: `Phase ${phase} Assigned Set`,
        description: 'Practice / Demo set',
        default_timer: 15,
        timer_policy: 'per_question',
        questions: qs
      };
    }

    const { data, error } = await supabase.rpc('get_assigned_question_set', {
      p_phase: phase
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return data;
  },

  async submitQuizAnswer(sessionId: string, questionId: string, answer: string, timeSpentSeconds: number): Promise<{
    success: boolean;
    is_correct: boolean;
    points_awarded: number;
    total_score: number;
    correct_answers?: string[];
  }> {
    if (!isSupabaseConfigured) {
      const q = mockQuestions.find(x => x.id === questionId);
      const correct = q?.choices?.[0]?.id || 'A';
      const isCorrect = answer === correct;
      const points = isCorrect ? (q?.scoring_points || 10) : 0;
      return {
        success: true,
        is_correct: isCorrect,
        points_awarded: points,
        total_score: points,
        correct_answers: [correct]
      };
    }

    const { data, error } = await supabase.rpc('submit_quiz_answer', {
      p_session_id: sessionId,
      p_question_id: questionId,
      p_selected_answer: answer,
      p_time_spent: timeSpentSeconds
    });

    if (error) throw error;
    if (data && !data.correct_answers && data.is_correct) {
      data.correct_answers = [answer];
    }
    return data;
  },

  // --------------------------------------------------------------------------
  // Competition Sessions & Exam Attempt Policy
  // --------------------------------------------------------------------------
  async getOrCreateSession(phase: PhaseId, assignedSetId?: string): Promise<{
    session: CompetitionSession;
    isNew: boolean;
  }> {
    // Authoritative exam start check: Exam must be started before session can be created or activated
    const controls = await this.getPhaseControls();
    const pControl = controls[phase];
    if (!pControl?.exam_started_at) {
      throw new Error(`The examination for ${pControl?.title || phase.toUpperCase()} has not officially started yet. Please wait in the Waiting Room.`);
    }

    if (!isSupabaseConfigured) {
      const key = `local_session_${phase}`;
      let s = mockSessions[key];
      if (!s) {
        s = {
          id: crypto.randomUUID(),
          participant_id: 'mock-user-id',
          phase,
          assigned_set_id: assignedSetId,
          status: 'active',
          started_at: new Date().toISOString(),
          is_qualified: false,
          final_score: 0,
          tie_break_duration_ms: 0,
          reentry_status: 'none',
          current_question_index: 0,
          current_question_started_at: new Date().toISOString(),
          is_locked: false
        };
        mockSessions[key] = s;
        return { session: s, isNew: true };
      }
      return { session: s, isNew: false };
    }

    const { data: authSession } = await supabase.auth.getSession();
    const userId = authSession.session?.user?.id;
    if (!userId) throw new Error('Authentication required to access exam session');

    // Query existing session
    const { data: existing, error: fetchErr } = await supabase
      .from('competition_sessions')
      .select('*')
      .eq('participant_id', userId)
      .eq('phase', phase)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (existing) {
      return { session: existing as CompetitionSession, isNew: false };
    }

    // Create single attempt session with backward-compatible schema fallback
    let created: any;
    const fullPayload = {
      participant_id: userId,
      phase,
      assigned_set_id: assignedSetId,
      status: 'active',
      reentry_status: 'none',
      current_question_index: 0,
      current_question_started_at: new Date().toISOString(),
      is_locked: false
    };

    const { data: c1, error: err1 } = await supabase
      .from('competition_sessions')
      .insert(fullPayload)
      .select()
      .single();

    if (err1) {
      console.warn('Full session insert notice, attempting base schema fallback:', err1.message);
      const basePayload = {
        participant_id: userId,
        phase,
        assigned_set_id: assignedSetId,
        status: 'active'
      };
      const { data: c2, error: err2 } = await supabase
        .from('competition_sessions')
        .insert(basePayload)
        .select()
        .single();

      if (err2) throw err2;
      created = {
        ...c2,
        current_question_index: 0,
        current_question_started_at: new Date().toISOString(),
        reentry_status: 'none',
        is_locked: false
      };
    } else {
      created = c1;
    }

    return { session: created as CompetitionSession, isNew: true };
  },

  async getSessionResponses(sessionId: string): Promise<QuizResponse[]> {
    if (!isSupabaseConfigured) {
      return mockQuizResponses[sessionId] || [];
    }

    const { data, error } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('submitted_at', { ascending: true });

    if (error) throw error;
    return (data || []) as QuizResponse[];
  },

  async updateSessionProgress(sessionId: string, nextIndex: number): Promise<void> {
    if (!isSupabaseConfigured) {
      const s = Object.values(mockSessions).find(x => x.id === sessionId);
      if (s) {
        s.current_question_index = nextIndex;
        s.current_question_started_at = new Date().toISOString();
      }
      return;
    }

    const { error } = await supabase
      .from('competition_sessions')
      .update({
        current_question_index: nextIndex,
        current_question_started_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) console.warn('Failed to persist question progress:', error);
  },

  async lockSession(sessionId: string, reason?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const s = Object.values(mockSessions).find(x => x.id === sessionId);
      if (s) s.is_locked = true;
      return;
    }

    const { error } = await supabase
      .from('competition_sessions')
      .update({ is_locked: true, reentry_reason: reason })
      .eq('id', sessionId);

    if (error) console.warn('Failed to lock session:', error);
  },

  async completeSession(sessionId: string, finalScore: number): Promise<void> {
    if (!isSupabaseConfigured) {
      const s = Object.values(mockSessions).find(x => x.id === sessionId);
      if (s) {
        s.status = 'completed';
        s.final_score = finalScore;
        s.ended_at = new Date().toISOString();
      }
      return;
    }

    const { error } = await supabase
      .from('competition_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        final_score: finalScore
      })
      .eq('id', sessionId);

    if (error) console.warn('Failed to complete session:', error);
  },

  async requestReentry(sessionId: string, reason: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const s = Object.values(mockSessions).find(x => x.id === sessionId);
      if (s) {
        s.reentry_status = 'requested';
        s.reentry_reason = reason;
      }
      await this.logAdminAction('REENTRY_REQUESTED', 'competition_sessions', sessionId, 'Participant requested exam re-entry', reason);
      return;
    }

    const { error } = await supabase
      .from('competition_sessions')
      .update({
        reentry_status: 'requested',
        reentry_reason: reason
      })
      .eq('id', sessionId);

    if (error) throw error;

    await this.logAdminAction('REENTRY_REQUESTED', 'competition_sessions', sessionId, 'Participant requested exam re-entry', reason);
  },

  async approveReentry(sessionId: string, mode: 'resume' | 'fresh', adminReason?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const s = Object.values(mockSessions).find(x => x.id === sessionId);
      if (s) {
        s.is_locked = false;
        s.status = 'active';
        if (mode === 'fresh') {
          s.reentry_status = 'approved_fresh';
          s.current_question_index = 0;
          s.current_question_started_at = new Date().toISOString();
          s.final_score = 0;
        } else {
          s.reentry_status = 'approved_resume';
        }
      }
      await this.logAdminAction('REENTRY_APPROVAL', 'competition_sessions', sessionId, `Admin approved ${mode} re-entry`, adminReason);
      return;
    }

    const updates: Partial<CompetitionSession> = {
      is_locked: false,
      status: 'active',
      reentry_status: mode === 'fresh' ? 'approved_fresh' : 'approved_resume'
    };

    if (mode === 'fresh') {
      updates.current_question_index = 0;
      updates.current_question_started_at = new Date().toISOString();
      updates.final_score = 0;
    }

    const { error } = await supabase
      .from('competition_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) throw error;

    await this.logAdminAction('REENTRY_APPROVAL', 'competition_sessions', sessionId, `Admin approved ${mode} re-entry`, adminReason);
  },

  async rejectReentry(sessionId: string, adminReason?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const s = Object.values(mockSessions).find(x => x.id === sessionId);
      if (s) {
        s.reentry_status = 'rejected';
        s.is_locked = true;
      }
      await this.logAdminAction('REENTRY_REJECTED', 'competition_sessions', sessionId, 'Admin rejected re-entry', adminReason);
      return;
    }

    const { error } = await supabase
      .from('competition_sessions')
      .update({
        reentry_status: 'rejected',
        is_locked: true
      })
      .eq('id', sessionId);

    if (error) throw error;

    await this.logAdminAction('REENTRY_REJECTED', 'competition_sessions', sessionId, 'Admin rejected re-entry', adminReason);
  },

  async getCompetitionSessions(phase?: PhaseId): Promise<CompetitionSession[]> {
    if (!isSupabaseConfigured) {
      return Object.values(mockSessions);
    }

    let query = supabase
      .from('competition_sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (phase) {
      query = query.eq('phase', phase);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as CompetitionSession[];
  },

  async submitCodeRun(payload: {
    question_id: string;
    phase: 'phase2' | 'phase3';
    submitted_code: string;
  }): Promise<any> {
    if (!isSupabaseConfigured) {
      // Offline/Local Simulation
      await new Promise(r => setTimeout(r, 1200));
      return {
        status: 'evaluated',
        predicted_output: '[AI-Simulated Python Output]\nFunction group_anagrams returned expected list of anagrams.',
        error_type: 'None',
        error_message: '',
        syntax_valid: true,
        requirements_met: true,
        accepted: true,
        issues: [],
        explanation: 'Simulated preview evaluation passed all edge cases.',
        attempt_status: { attempts_used: 1, is_solved: true, is_locked: false }
      };
    }

    // Call Supabase Edge Function 'submit-run'
    let { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      const refreshed = await supabase.auth.refreshSession();
      sessionData = refreshed.data as any;
    }
    const token = sessionData.session?.access_token;
    if (!token) {
      throw new Error('Your login session has expired. Please log out and log in again.');
    }

    let response: Response;
    try {
      response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } catch {
      throw new Error(
        'Could not reach the evaluation service (submit-run). Make sure the edge functions are deployed: ' +
        '`supabase functions deploy submit-run ai-evaluate`, and that GEMINI_API_KEY is set as a function secret.'
      );
    }

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || result.details || 'Code evaluation request failed');
    }

    return result;
  },

  async getParticipantProgramAttempts(phase: 'phase2' | 'phase3'): Promise<{
    attempts: Record<string, { attempts_used: number; is_solved: boolean; is_locked: boolean }>;
    latestRuns: Record<string, { submitted_code: string; ai_response: any; is_accepted: boolean; created_at: string }>;
  }> {
    if (!isSupabaseConfigured) {
      return { attempts: {}, latestRuns: {} };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { attempts: {}, latestRuns: {} };

    const { data: attemptsData, error: attemptsError } = await supabase
      .from('program_attempts')
      .select('question_id, attempts_used, is_solved, is_locked')
      .eq('participant_id', user.id)
      .eq('phase', phase);

    if (attemptsError) {
      console.warn('Error fetching participant attempts:', attemptsError);
    }

    const { data: runsData, error: runsError } = await supabase
      .from('run_results')
      .select('question_id, submitted_code, ai_response, is_accepted, created_at')
      .eq('participant_id', user.id)
      .eq('phase', phase)
      .order('created_at', { ascending: false });

    if (runsError) {
      console.warn('Error fetching participant run results:', runsError);
    }

    const attempts: Record<string, { attempts_used: number; is_solved: boolean; is_locked: boolean }> = {};
    for (const item of (attemptsData || [])) {
      attempts[item.question_id] = {
        attempts_used: item.attempts_used,
        is_solved: item.is_solved,
        is_locked: item.is_locked
      };
    }

    const latestRuns: Record<string, { submitted_code: string; ai_response: any; is_accepted: boolean; created_at: string }> = {};
    for (const run of (runsData || [])) {
      if (!latestRuns[run.question_id]) {
        latestRuns[run.question_id] = {
          submitted_code: run.submitted_code,
          ai_response: run.ai_response,
          is_accepted: run.is_accepted,
          created_at: run.created_at
        };
      }
    }

    return { attempts, latestRuns };
  },

  // --------------------------------------------------------------------------
  // Evaluation Reviews & Overrides
  // --------------------------------------------------------------------------
  async getRunResults(): Promise<RunResult[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('run_results')
      .select(`
        *,
        profiles:participant_id ( full_name, email, section, academic_year ),
        questions:question_id ( title )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((r: any) => ({
      ...r,
      participant_name: r.profiles?.full_name,
      participant_email: r.profiles?.email,
      participant_section: r.profiles?.section,
      participant_year: r.profiles?.academic_year,
      question_title: r.questions?.title
    })) as RunResult[];
  },

  async overrideEvaluation(runResultId: string, newDecision: boolean, reason: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase.rpc('admin_override_evaluation', {
      p_run_result_id: runResultId,
      p_new_decision: newDecision,
      p_reason: reason
    });

    if (error) throw error;
  },

  // --------------------------------------------------------------------------
  // Leaderboard
  // --------------------------------------------------------------------------
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!isSupabaseConfigured) {
      return [
        {
          user_id: '1',
          full_name: 'Adithya Kumar',
          email: 'adithya@svce.ac.in',
          section: 'A',
          academic_year: 'III',
          phase1_score: 200,
          phase2_score: 100,
          phase3_solved: 3,
          total_score: 300,
          rank: 1,
          is_qualified_p2: true,
          is_qualified_p3: true,
          is_winner: true
        },
        {
          user_id: '2',
          full_name: 'Bhavana Sri',
          email: 'bhavana@svce.ac.in',
          section: 'B',
          academic_year: 'II',
          phase1_score: 190,
          phase2_score: 100,
          phase3_solved: 3,
          total_score: 290,
          rank: 2,
          is_qualified_p2: true,
          is_qualified_p3: true,
          is_runner_up: true
        }
      ];
    }

    // Fetch profiles and compute aggregated scores
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .neq('registration_status', 'disqualified');

    if (pErr || !profiles) return [];

    // Fetch quiz scores (Phase 1)
    const { data: quizResponses } = await supabase
      .from('quiz_responses')
      .select('participant_id, points_awarded');

    // Fetch solved attempts (Phase 2 & Phase 3)
    const { data: programAttempts } = await supabase
      .from('program_attempts')
      .select('participant_id, phase, is_solved, solved_at');

    // Fetch competition settings to check winner declarations
    const settings = await this.getCompetitionSettings();

    const p1Map = new Map<string, number>();
    quizResponses?.forEach(r => {
      p1Map.set(r.participant_id, (p1Map.get(r.participant_id) || 0) + (r.points_awarded || 0));
    });

    const p2Map = new Map<string, number>();
    const p3Map = new Map<string, number>();
    const p3CompleteTimeMap = new Map<string, string>();

    programAttempts?.forEach(a => {
      if (a.is_solved) {
        if (a.phase === 'phase2') {
          p2Map.set(a.participant_id, (p2Map.get(a.participant_id) || 0) + 30);
        } else if (a.phase === 'phase3') {
          p3Map.set(a.participant_id, (p3Map.get(a.participant_id) || 0) + 1);
          if (a.solved_at) {
            const current = p3CompleteTimeMap.get(a.participant_id);
            if (!current || new Date(a.solved_at) > new Date(current)) {
              p3CompleteTimeMap.set(a.participant_id, a.solved_at);
            }
          }
        }
      }
    });

    const entries: LeaderboardEntry[] = profiles.map(p => {
      const p1 = p1Map.get(p.user_id) || 0;
      const p2 = p2Map.get(p.user_id) || 0;
      const p3 = p3Map.get(p.user_id) || 0;
      const total = p1 + p2 + (p3 * 50);

      return {
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        section: p.section as SectionType,
        academic_year: p.academic_year as AcademicYearType,
        phase1_score: p1,
        phase2_score: p2,
        phase3_solved: p3,
        phase3_completed_at: p3CompleteTimeMap.get(p.user_id),
        total_score: total,
        rank: 0,
        is_qualified_p2: p1 >= 100,
        is_qualified_p3: p2 >= 60,
        is_winner: settings.winner_id === p.user_id,
        is_runner_up: settings.runner_up_id === p.user_id
      };
    });

    // Deterministic Rank Sort:
    // 1. Phase 3 solved count descending
    // 2. Earliest Phase 3 completion time ascending
    // 3. Total score descending
    // 4. Alphabetical by name
    entries.sort((a, b) => {
      if (b.phase3_solved !== a.phase3_solved) {
        return b.phase3_solved - a.phase3_solved;
      }
      if (a.phase3_solved === 3 && b.phase3_solved === 3) {
        if (a.phase3_completed_at && b.phase3_completed_at) {
          return new Date(a.phase3_completed_at).getTime() - new Date(b.phase3_completed_at).getTime();
        }
      }
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      return a.full_name.localeCompare(b.full_name);
    });

    entries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return entries;
  },

  async getPhaseLeaderboard(phase: PhaseId, runNumber?: number): Promise<PhaseLeaderboardEntry[]> {
    const settings = await this.getCompetitionSettings();
    const controls = await this.getPhaseControls();
    const pControl = controls[phase];
    const targetRun = runNumber || pControl?.current_run_number || 1;

    // Check visibility for non-admins
    if (isSupabaseConfigured) {
      const { data: authSession } = await supabase.auth.getSession();
      const userId = authSession.session?.user?.id;
      let userIsAdmin = false;
      if (userId) {
        const { data: roleData } = await supabase
          .from('admin_roles')
          .select('role, status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();
        userIsAdmin = Boolean(roleData);
      }

      if (!settings.leaderboard_visible && !userIsAdmin) {
        return [];
      }
    }

    if (!isSupabaseConfigured) {
      // Mock data for preview
      const mockList: PhaseLeaderboardEntry[] = [
        {
          user_id: 'mock-1',
          full_name: 'Adithya Kumar',
          email: 'adithya@svce.ac.in',
          section: 'A',
          academic_year: 'III',
          phase,
          run_number: targetRun,
          score: phase === 'phase1' ? 190 : phase === 'phase2' ? 90 : 3,
          rank: 1,
          detail: phase === 'phase1' ? '19 / 20 Correct' : phase === 'phase2' ? '3 Debugging Challenges Solved' : '3 Logic Programs Solved (Winner)',
          time_spent_seconds: 140,
          solved_count: phase === 'phase3' ? 3 : undefined,
          is_winner: phase === 'phase3' ? true : undefined
        },
        {
          user_id: 'mock-2',
          full_name: 'Bhavana Sri',
          email: 'bhavana@svce.ac.in',
          section: 'B',
          academic_year: 'II',
          phase,
          run_number: targetRun,
          score: phase === 'phase1' ? 170 : phase === 'phase2' ? 60 : 3,
          rank: 2,
          detail: phase === 'phase1' ? '17 / 20 Correct' : phase === 'phase2' ? '2 Debugging Challenges Solved' : '3 Logic Programs Solved (Runner-Up)',
          time_spent_seconds: 175,
          solved_count: phase === 'phase3' ? 3 : undefined,
          is_runner_up: phase === 'phase3' ? true : undefined
        }
      ];
      return mockList;
    }

    // Check if targetRun is an archived historical run
    if (runNumber && runNumber < (pControl?.current_run_number || 1)) {
      const { data: arch } = await supabase
        .from('archived_phase_runs')
        .select('leaderboard_data')
        .eq('phase', phase)
        .eq('run_number', runNumber)
        .maybeSingle();

      if (arch && arch.leaderboard_data && (arch.leaderboard_data as any).length > 0) {
        return arch.leaderboard_data as PhaseLeaderboardEntry[];
      }
    }

    // 1. Try server-side RPC first (returns all participants securely via SECURITY DEFINER)
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_phase_leaderboard', {
        p_phase: phase,
        p_run_number: targetRun
      });
      if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
        return rpcData as PhaseLeaderboardEntry[];
      }
      if (rpcErr) console.error('[leaderboard] get_phase_leaderboard failed - run migration 20261021000000_fix_visibility_idempotent.sql:', rpcErr.message);
    } catch (_) {
      // Fallback to direct client query below
    }

    // Active run live leaderboard calculation (Client fallback)
    // Fetch registered active participants
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, section, academic_year')
      .neq('registration_status', 'disqualified');

    if (pErr || !profiles) return [];
    const profileMap = new Map(profiles.map(p => [p.user_id, p]));

    if (phase === 'phase1') {
      const { data: responses, error: rErr } = await supabase
        .from('quiz_responses')
        .select('participant_id, points_awarded, time_spent_seconds, submitted_at');

      if (rErr || !responses || responses.length === 0) return [];

      const statsMap = new Map<string, { totalScore: number; totalTime: number; count: number }>();
      responses.forEach(r => {
        const cur = statsMap.get(r.participant_id) || { totalScore: 0, totalTime: 0, count: 0 };
        cur.totalScore += (r.points_awarded || 0);
        cur.totalTime += Number(r.time_spent_seconds || 0);
        cur.count += 1;
        statsMap.set(r.participant_id, cur);
      });

      const entries: PhaseLeaderboardEntry[] = [];
      statsMap.forEach((stats, participantId) => {
        const prof = profileMap.get(participantId);
        if (!prof) return;

        entries.push({
          user_id: prof.user_id,
          full_name: prof.full_name,
          email: prof.email,
          section: prof.section as SectionType,
          academic_year: prof.academic_year as AcademicYearType,
          phase: 'phase1',
          run_number: targetRun,
          score: stats.totalScore,
          rank: 0,
          detail: `${Math.round(stats.totalScore / 10)} / ${stats.count} Correct`,
          time_spent_seconds: Math.round(stats.totalTime)
        });
      });

      entries.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if ((a.time_spent_seconds || 0) !== (b.time_spent_seconds || 0)) {
          return (a.time_spent_seconds || 0) - (b.time_spent_seconds || 0);
        }
        return a.full_name.localeCompare(b.full_name);
      });

      entries.forEach((e, idx) => { e.rank = idx + 1; });
      return entries;
    }

    if (phase === 'phase2') {
      const { data: attempts } = await supabase
        .from('program_attempts')
        .select('participant_id, is_solved, solved_at, attempts_used')
        .eq('phase', 'phase2');

      if (!attempts || attempts.length === 0) return [];

      const statsMap = new Map<string, { solvedCount: number; attemptsUsed: number; earliestSolved?: string }>();
      attempts.forEach(a => {
        const cur = statsMap.get(a.participant_id) || { solvedCount: 0, attemptsUsed: 0 };
        cur.attemptsUsed += (a.attempts_used || 0);
        if (a.is_solved) {
          cur.solvedCount += 1;
          if (a.solved_at) {
            if (!cur.earliestSolved || new Date(a.solved_at) > new Date(cur.earliestSolved)) {
              cur.earliestSolved = a.solved_at;
            }
          }
        }
        statsMap.set(a.participant_id, cur);
      });

      const entries: PhaseLeaderboardEntry[] = [];
      statsMap.forEach((stats, participantId) => {
        const prof = profileMap.get(participantId);
        if (!prof) return;

        const score = stats.solvedCount * 30;
        entries.push({
          user_id: prof.user_id,
          full_name: prof.full_name,
          email: prof.email,
          section: prof.section as SectionType,
          academic_year: prof.academic_year as AcademicYearType,
          phase: 'phase2',
          run_number: targetRun,
          score,
          rank: 0,
          detail: `${stats.solvedCount} Solved (${stats.attemptsUsed} Attempts)`
        });
      });

      entries.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.full_name.localeCompare(b.full_name);
      });

      entries.forEach((e, idx) => { e.rank = idx + 1; });
      return entries;
    }

    if (phase === 'phase3') {
      const { data: attempts } = await supabase
        .from('program_attempts')
        .select('participant_id, is_solved, solved_at, attempts_used')
        .eq('phase', 'phase3');

      if (!attempts || attempts.length === 0) return [];

      const statsMap = new Map<string, { solvedCount: number; completedAt?: string }>();
      attempts.forEach(a => {
        const cur = statsMap.get(a.participant_id) || { solvedCount: 0 };
        if (a.is_solved) {
          cur.solvedCount += 1;
          if (a.solved_at) {
            if (!cur.completedAt || new Date(a.solved_at) > new Date(cur.completedAt)) {
              cur.completedAt = a.solved_at;
            }
          }
        }
        statsMap.set(a.participant_id, cur);
      });

      const entries: PhaseLeaderboardEntry[] = [];
      statsMap.forEach((stats, participantId) => {
        const prof = profileMap.get(participantId);
        if (!prof) return;

        entries.push({
          user_id: prof.user_id,
          full_name: prof.full_name,
          email: prof.email,
          section: prof.section as SectionType,
          academic_year: prof.academic_year as AcademicYearType,
          phase: 'phase3',
          run_number: targetRun,
          score: stats.solvedCount * 50,
          rank: 0,
          solved_count: stats.solvedCount,
          completed_at: stats.completedAt,
          detail: stats.solvedCount === 3
            ? `3 / 3 Solved at ${stats.completedAt ? new Date(stats.completedAt).toLocaleTimeString() : 'N/A'}`
            : `${stats.solvedCount} / 3 Solved`
        });
      });

      entries.sort((a, b) => {
        const aCount = a.solved_count || 0;
        const bCount = b.solved_count || 0;
        if (bCount !== aCount) return bCount - aCount;
        if (aCount === 3 && bCount === 3) {
          if (a.completed_at && b.completed_at) {
            return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
          }
        }
        return a.full_name.localeCompare(b.full_name);
      });

      entries.forEach((e, idx) => {
        e.rank = idx + 1;
        if (e.rank === 1 && (e.solved_count || 0) > 0) e.is_winner = true;
        if (e.rank === 2 && (e.solved_count || 0) > 0) e.is_runner_up = true;
      });

      return entries;
    }

    return [];
  },

  async getArchivedRuns(phase: PhaseId): Promise<ArchivedPhaseRun[]> {
    if (!isSupabaseConfigured) {
      return mockArchivedRuns.filter(r => r.phase === phase);
    }

    const { data, error } = await supabase
      .from('archived_phase_runs')
      .select('*')
      .eq('phase', phase)
      .order('run_number', { ascending: false });

    if (error) {
      console.warn('Could not fetch archived runs table, returning empty:', error.message);
      return [];
    }
    return (data || []) as ArchivedPhaseRun[];
  },

  // --------------------------------------------------------------------------
  // Audit Logs
  // --------------------------------------------------------------------------
  async getAuditLogs(): Promise<AdminAuditLog[]> {
    if (!isSupabaseConfigured) return mockAuditLogs;

    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return (data || []) as AdminAuditLog[];
  },

  async logAdminAction(action: string, targetType: string, targetId: string, summary: string, reason?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockAuditLogs.unshift({
        id: crypto.randomUUID(),
        action,
        target_type: targetType,
        target_id: targetId,
        change_summary: summary,
        reason,
        created_at: new Date().toISOString()
      });
      return;
    }

    const { data: session } = await supabase.auth.getSession();
    const adminId = session.session?.user.id;

    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId || null,
      action,
      target_type: targetType,
      target_id: targetId,
      change_summary: summary,
      reason
    });
  },

  async getWaitingRoomCount(phase: PhaseId): Promise<number> {
    if (!isSupabaseConfigured) return 24;

    try {
      const { data, error } = await supabase.rpc('get_waiting_room_count', { p_phase: phase });
      if (!error && typeof data === 'number') {
        return data;
      }
      if (error) console.error('[waiting room] get_waiting_room_count failed - run migration 20261021000000_fix_visibility_idempotent.sql:', error.message);
    } catch (_) {
      // ignore and fallback below
    }

    // Direct fallback query
    try {
      if (phase === 'phase1') {
        const { count } = await supabase
          .from('profiles')
          .select('user_id', { count: 'exact', head: true })
          .neq('registration_status', 'disqualified');
        return count || 0;
      } else {
        const { count } = await supabase
          .from('phase_qualifications')
          .select('participant_id', { count: 'exact', head: true })
          .eq('phase', phase)
          .eq('qualified', true);
        if (count && count > 0) return count;

        const { count: profCount } = await supabase
          .from('profiles')
          .select('user_id', { count: 'exact', head: true })
          .neq('registration_status', 'disqualified');
        return profCount || 0;
      }
    } catch (err) {
      return 0;
    }
  }
};
