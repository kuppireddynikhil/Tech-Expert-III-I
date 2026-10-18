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
  RunResult,
  AdminAuditLog,
  SectionType,
  AcademicYearType,
  PhaseId,
  CompetitionSession,
  QuizResponse
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
    status: 'active',
    default_question_timer: 15,
    total_deadline_minutes: 0,
    qualification_limit: 15,
    randomize_questions: false,
    updated_at: new Date().toISOString()
  },
  phase2: {
    phase: 'phase2',
    title: 'Phase 2: Python Debugging Challenge',
    status: 'scheduled',
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
    default_question_timer: 0,
    total_deadline_minutes: 0,
    qualification_limit: 2,
    randomize_questions: false,
    updated_at: new Date().toISOString()
  }
};

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
      map[p.phase as PhaseId] = p;
    });
    return map;
  },

  async updatePhaseControl(phase: PhaseId, updates: Partial<PhaseControl>, adminReason?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockPhaseControls[phase] = { ...mockPhaseControls[phase], ...updates };
      return;
    }

    const { error } = await supabase
      .from('phase_controls')
      .update(updates)
      .eq('phase', phase);

    if (error) throw error;

    await this.logAdminAction('UPDATE_PHASE_CONTROL', 'phase_controls', phase, JSON.stringify(updates), adminReason);
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
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || result.details || 'Code evaluation request failed');
    }

    return result;
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
      .eq('registration_status', 'active');

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
  }
};
