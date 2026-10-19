// TECH EXPERT 2K26 — CORE DOMAIN TYPES
// Sri Venkateswara College of Engineering (SVCE)

export type SectionType = 'A' | 'B' | 'C' | 'D' | 'E';
export type AcademicYearType = 'I' | 'II' | 'III';
export type RegistrationStatus = 'registered' | 'active' | 'suspended' | 'disqualified';
export type PhaseId = 'phase1' | 'phase2' | 'phase3';
export type EventPhase = 'registration' | 'phase1' | 'phase2' | 'phase3' | 'concluded';
export type PhaseStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'closed';
export type QuestionType = 'mcq' | 'debug' | 'logic';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type TimerPolicy = 'per_question' | 'total_phase' | 'unlimited';
export type AssignmentTargetType = 'all' | 'section' | 'academic_year' | 'section_year' | 'participant';

export interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  college_id?: string;
  section: SectionType;
  academic_year: AcademicYearType;
  registration_status: RegistrationStatus;
  created_at: string;
  updated_at: string;
}

export interface AdminRole {
  user_id: string;
  role: 'super_admin' | 'admin' | 'evaluator';
  status: 'active' | 'revoked';
  must_change_password: boolean;
  granted_by?: string;
  created_at: string;
}

export interface CompetitionSettings {
  id: string;
  event_name: string;
  current_phase: EventPhase;
  event_status: 'draft' | 'active' | 'paused' | 'completed';
  leaderboard_visible: boolean;
  winner_id?: string;
  runner_up_id?: string;
  winner_declared_at?: string;
  metadata?: Record<string, any>;
  updated_at: string;
}

export interface PhaseControl {
  phase: PhaseId;
  title: string;
  status: PhaseStatus;
  start_time?: string;
  end_time?: string;
  default_question_timer: number;
  total_deadline_minutes: number;
  qualification_limit: number;
  scoring_rules?: Record<string, any>;
  randomize_questions: boolean;
  updated_at: string;
}

export interface QuestionChoice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  phase: PhaseId;
  question_type: QuestionType;
  title: string;
  problem_statement: string;
  choices: QuestionChoice[];
  private_correct_answers?: string[];
  starter_code: string;
  private_reference_solution?: string;
  private_evaluation_rubric?: any;
  scoring_points: number;
  custom_timer?: number | null;
  difficulty: QuestionDifficulty;
  tags: string[];
  is_published: boolean;
  is_archived: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  // Computed client-side or from view
  effective_timer?: number;
  display_order?: number;
}

export interface QuestionSet {
  id: string;
  set_name: string;
  phase: PhaseId;
  description: string;
  is_published: boolean;
  is_archived: boolean;
  default_timer: number;
  timer_policy: TimerPolicy;
  created_at: string;
  updated_at: string;
  items?: QuestionSetItem[];
}

export interface QuestionSetItem {
  id: string;
  set_id: string;
  question_id: string;
  display_order: number;
  timer_override?: number | null;
  question?: Question;
}

export interface QuestionSetAssignment {
  id: string;
  set_id: string;
  target_type: AssignmentTargetType;
  target_value: string;
  is_active: boolean;
  assigned_by?: string;
  created_at: string;
  set_name?: string;
}

export type ReentryStatus = 'none' | 'requested' | 'approved_resume' | 'approved_fresh' | 'rejected';

export interface CompetitionSession {
  id: string;
  participant_id: string;
  phase: PhaseId;
  assigned_set_id?: string;
  status: 'active' | 'completed' | 'expired' | 'abandoned';
  started_at: string;
  ended_at?: string;
  is_qualified: boolean;
  final_score: number;
  tie_break_duration_ms: number;
  reentry_status?: ReentryStatus;
  reentry_reason?: string;
  current_question_index?: number;
  current_question_started_at?: string;
  is_locked?: boolean;
}

export interface QuizResponse {
  id: string;
  session_id: string;
  participant_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  points_awarded: number;
  effective_timer: number;
  time_spent_seconds: number;
  submitted_at: string;
}

export interface ProgramAttempt {
  id: string;
  participant_id: string;
  question_id: string;
  phase: 'phase2' | 'phase3';
  attempts_used: number;
  is_solved: boolean;
  is_locked: boolean;
  first_attempt_at?: string;
  last_attempt_at?: string;
  solved_at?: string;
  created_at?: string;
}

export interface AIResponse {
  status: 'evaluated' | 'failed' | 'overridden';
  predicted_output: string;
  error_type: string;
  error_message: string;
  syntax_valid: boolean;
  requirements_met: boolean;
  accepted: boolean;
  issues: string[];
  explanation: string;
  request_identifier?: string;
}

export interface RunResult {
  id: string;
  participant_id: string;
  question_id: string;
  phase: 'phase2' | 'phase3';
  submitted_code: string;
  ai_response: AIResponse;
  is_accepted: boolean;
  evaluation_status: 'evaluated' | 'failed' | 'overridden';
  model_identifier: string;
  request_identifier: string;
  created_at: string;
  // Joined fields for display
  participant_name?: string;
  participant_email?: string;
  participant_section?: string;
  participant_year?: string;
  question_title?: string;
}

export interface EvaluationOverride {
  id: string;
  run_result_id: string;
  participant_id: string;
  question_id: string;
  admin_id: string;
  previous_decision: boolean;
  new_decision: boolean;
  reason: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id?: string;
  action: string;
  target_type: string;
  target_id?: string;
  change_summary: string;
  reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
  admin_email?: string;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  email: string;
  section: SectionType;
  academic_year: AcademicYearType;
  phase1_score: number;
  phase2_score: number;
  phase3_solved: number;
  phase3_completed_at?: string;
  total_score: number;
  rank: number;
  is_qualified_p2: boolean;
  is_qualified_p3: boolean;
  is_winner?: boolean;
  is_runner_up?: boolean;
}

export interface AdvancementCandidate {
  user_id: string;
  full_name: string;
  email: string;
  section: SectionType;
  academic_year: AcademicYearType;
  score: number;
  detail: string;
  tie_break: number; // lower is better (ms or seconds); used only to break equal scores
  rank: number;
  selected: boolean;
}

export type AdvancementTarget = 'phase2' | 'phase3';
