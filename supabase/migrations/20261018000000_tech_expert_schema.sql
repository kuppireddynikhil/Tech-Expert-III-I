-- ============================================================================
-- TECH EXPERT 2K26 — MASTER DATABASE SCHEMA & SECURITY POLICIES
-- Sri Venkateswara College of Engineering (SVCE)
-- ============================================================================

-- Enable pgcrypto for UUID generation if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Profiles & Participant Metadata
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    college_id TEXT,
    section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E')),
    academic_year TEXT NOT NULL CHECK (academic_year IN ('I', 'II', 'III')),
    registration_status TEXT NOT NULL DEFAULT 'registered' CHECK (registration_status IN ('registered', 'active', 'suspended', 'disqualified')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_section_year ON public.profiles(section, academic_year);
CREATE INDEX IF NOT EXISTS idx_profiles_registration_status ON public.profiles(registration_status);

-- ----------------------------------------------------------------------------
-- 2. Trusted Admin Roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'evaluator')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Helper function to check if caller is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = p_user_id AND status = 'active'
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. Competition Settings & Phase Controls
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.competition_settings (
    id TEXT PRIMARY KEY DEFAULT 'svce_2k26',
    event_name TEXT NOT NULL DEFAULT 'Tech Expert 2K26',
    current_phase TEXT NOT NULL DEFAULT 'registration' CHECK (current_phase IN ('registration', 'phase1', 'phase2', 'phase3', 'concluded')),
    event_status TEXT NOT NULL DEFAULT 'draft' CHECK (event_status IN ('draft', 'active', 'paused', 'completed')),
    leaderboard_visible BOOLEAN NOT NULL DEFAULT false,
    winner_id UUID REFERENCES auth.users(id),
    runner_up_id UUID REFERENCES auth.users(id),
    winner_declared_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.phase_controls (
    phase TEXT PRIMARY KEY CHECK (phase IN ('phase1', 'phase2', 'phase3')),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'closed')),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    default_question_timer INTEGER NOT NULL DEFAULT 15, -- in seconds
    total_deadline_minutes INTEGER NOT NULL DEFAULT 15, -- for phase 2
    qualification_limit INTEGER NOT NULL DEFAULT 15,    -- default 15 for phase 1, 5 for phase 2
    scoring_rules JSONB NOT NULL DEFAULT '{"correct": 10, "wrong": 0}'::jsonb,
    randomize_questions BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed default phase controls
INSERT INTO public.phase_controls (phase, title, status, default_question_timer, total_deadline_minutes, qualification_limit)
VALUES 
  ('phase1', 'Phase 1: Python Quick Quiz', 'draft', 15, 0, 15),
  ('phase2', 'Phase 2: Python Debugging Challenge', 'draft', 0, 15, 5),
  ('phase3', 'Phase 3: Python Logic Builder', 'draft', 0, 0, 2)
ON CONFLICT (phase) DO NOTHING;

INSERT INTO public.competition_settings (id, event_name, current_phase, event_status, leaderboard_visible)
VALUES ('svce_2k26', 'Tech Expert 2K26', 'registration', 'draft', false)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Central Question Bank
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase TEXT NOT NULL CHECK (phase IN ('phase1', 'phase2', 'phase3')),
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'debug', 'logic')),
    title TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    choices JSONB NOT NULL DEFAULT '[]'::jsonb,              -- e.g. [{"id": "A", "text": "..."}, ...]
    private_correct_answers JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ["A"] (PRIVATE)
    starter_code TEXT NOT NULL DEFAULT '',
    private_reference_solution TEXT NOT NULL DEFAULT '',    -- (PRIVATE)
    private_evaluation_rubric JSONB NOT NULL DEFAULT '{}'::jsonb, -- (PRIVATE)
    scoring_points INTEGER NOT NULL DEFAULT 10,
    custom_timer INTEGER,                                    -- Question-level override in seconds
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_questions_phase_type ON public.questions(phase, question_type);
CREATE INDEX IF NOT EXISTS idx_questions_published ON public.questions(is_published, is_archived);

-- ----------------------------------------------------------------------------
-- 5. Multiple Question Sets & Items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_name TEXT NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('phase1', 'phase2', 'phase3')),
    description TEXT NOT NULL DEFAULT '',
    is_published BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    default_timer INTEGER NOT NULL DEFAULT 15,
    timer_policy TEXT NOT NULL DEFAULT 'per_question' CHECK (timer_policy IN ('per_question', 'total_phase', 'unlimited')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.question_set_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
    display_order INTEGER NOT NULL DEFAULT 0,
    timer_override INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(set_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_set_items_order ON public.question_set_items(set_id, display_order);

-- ----------------------------------------------------------------------------
-- 6. Question Set Assignments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_set_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'section', 'academic_year', 'section_year', 'participant')),
    target_value TEXT NOT NULL, -- 'A', 'I', 'A-I', or user UUID, or 'all'
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_assignments_target ON public.question_set_assignments(target_type, target_value, is_active);

-- ----------------------------------------------------------------------------
-- 7. Participant Permissions & Releases
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.participant_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('phase1', 'phase2', 'phase3', 'event')),
    status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'revoked', 'qualified', 'disqualified')),
    granted_by UUID REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(participant_id, resource_type)
);

CREATE TABLE IF NOT EXISTS public.question_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('question', 'set', 'phase')),
    resource_id TEXT NOT NULL,
    is_released BOOLEAN NOT NULL DEFAULT true,
    released_by UUID REFERENCES auth.users(id),
    released_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    revoked_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 8. Competition Sessions & Quiz Responses
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.competition_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phase TEXT NOT NULL CHECK (phase IN ('phase1', 'phase2', 'phase3')),
    assigned_set_id UUID REFERENCES public.question_sets(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'abandoned')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    is_qualified BOOLEAN NOT NULL DEFAULT false,
    final_score INTEGER NOT NULL DEFAULT 0,
    tie_break_duration_ms BIGINT NOT NULL DEFAULT 0,
    UNIQUE(participant_id, phase)
);

CREATE TABLE IF NOT EXISTS public.quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.competition_sessions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
    selected_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    points_awarded INTEGER NOT NULL DEFAULT 0,
    effective_timer INTEGER NOT NULL DEFAULT 15,
    time_spent_seconds NUMERIC(6, 2) NOT NULL DEFAULT 0,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(participant_id, question_id)
);

-- ----------------------------------------------------------------------------
-- 9. Program Attempts & Code Run Submissions (Phase 2 & Phase 3)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.program_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
    phase TEXT NOT NULL CHECK (phase IN ('phase2', 'phase3')),
    attempts_used INTEGER NOT NULL DEFAULT 0 CHECK (attempts_used >= 0),
    is_solved BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    first_attempt_at TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ,
    solved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(participant_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.run_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
    phase TEXT NOT NULL CHECK (phase IN ('phase2', 'phase3')),
    submitted_code TEXT NOT NULL,
    ai_response JSONB NOT NULL,
    is_accepted BOOLEAN NOT NULL DEFAULT false,
    evaluation_status TEXT NOT NULL DEFAULT 'evaluated' CHECK (evaluation_status IN ('evaluated', 'failed', 'overridden')),
    model_identifier TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    request_identifier TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.evaluation_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_result_id UUID NOT NULL REFERENCES public.run_results(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    previous_decision BOOLEAN NOT NULL,
    new_decision BOOLEAN NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------------
-- 10. Admin Audit Logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    change_summary TEXT NOT NULL,
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 11. Public Participant-Safe View for Questions
-- Hides private_correct_answers, private_reference_solution, private_evaluation_rubric
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.participant_questions_view AS
SELECT 
    q.id,
    q.phase,
    q.question_type,
    q.title,
    q.problem_statement,
    q.choices,
    q.starter_code,
    q.scoring_points,
    q.custom_timer,
    q.difficulty,
    q.tags,
    q.is_published,
    q.version
FROM public.questions q
WHERE q.is_published = true AND q.is_archived = false;

-- ----------------------------------------------------------------------------
-- 12. Row Level Security (RLS) Policies
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_set_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_set_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own profile; Admins can read/manage all
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

-- Admin roles: Users can read their own role; super_admins can manage
CREATE POLICY "Users can read own admin role" ON public.admin_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage admin_roles" ON public.admin_roles
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND role = 'super_admin' AND status = 'active')
    );

-- Competition Settings & Phase Controls: Readable by authenticated users, manageable only by admins
CREATE POLICY "Everyone can read competition_settings" ON public.competition_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update competition_settings" ON public.competition_settings
    FOR ALL USING (public.is_admin());

CREATE POLICY "Everyone can read phase_controls" ON public.phase_controls
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage phase_controls" ON public.phase_controls
    FOR ALL USING (public.is_admin());

-- Questions: Full access for Admins; Participants can only access published questions via views/functions
CREATE POLICY "Admins have full access to questions" ON public.questions
    FOR ALL USING (public.is_admin());

CREATE POLICY "Participants cannot directly select raw questions with private solutions" ON public.questions
    FOR SELECT USING (public.is_admin());

-- Question sets & items: Admins full control; Participants can view published sets
CREATE POLICY "Admins can manage question sets" ON public.question_sets
    FOR ALL USING (public.is_admin());

CREATE POLICY "Participants can view published sets" ON public.question_sets
    FOR SELECT USING (is_published = true AND is_archived = false);

CREATE POLICY "Admins can manage question set items" ON public.question_set_items
    FOR ALL USING (public.is_admin());

CREATE POLICY "Participants can read set items" ON public.question_set_items
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage assignments" ON public.question_set_assignments
    FOR ALL USING (public.is_admin());

CREATE POLICY "Participants can read active assignments" ON public.question_set_assignments
    FOR SELECT USING (is_active = true);

-- Participant Permissions: User can read own, admins manage
CREATE POLICY "Users read own permissions" ON public.participant_permissions
    FOR SELECT USING (auth.uid() = participant_id OR public.is_admin());

CREATE POLICY "Admins manage permissions" ON public.participant_permissions
    FOR ALL USING (public.is_admin());

-- Competition Sessions: User can read and create their own session
CREATE POLICY "Users manage own sessions" ON public.competition_sessions
    FOR ALL USING (auth.uid() = participant_id OR public.is_admin());

-- Quiz Responses: User can view and insert own responses; cannot alter correct answers directly
CREATE POLICY "Users manage own quiz responses" ON public.quiz_responses
    FOR ALL USING (auth.uid() = participant_id OR public.is_admin());

-- Program Attempts: User can view own attempts; admin full control
CREATE POLICY "Users view own program attempts" ON public.program_attempts
    FOR SELECT USING (auth.uid() = participant_id OR public.is_admin());

CREATE POLICY "Admins manage program attempts" ON public.program_attempts
    FOR ALL USING (public.is_admin());

-- Run Results: User can view own run results; admin full control
CREATE POLICY "Users view own run results" ON public.run_results
    FOR SELECT USING (auth.uid() = participant_id OR public.is_admin());

CREATE POLICY "Admins manage run results" ON public.run_results
    FOR ALL USING (public.is_admin());

-- Evaluation Overrides & Audit Logs: Admin only
CREATE POLICY "Admins manage evaluation overrides" ON public.evaluation_overrides
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins read audit logs" ON public.admin_audit_logs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins insert audit logs" ON public.admin_audit_logs
    FOR INSERT WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 13. Automatic Trigger for New User Profiles
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    college_id,
    section,
    academic_year,
    registration_status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Participant'),
    NEW.email,
    NEW.raw_user_meta_data->>'college_id',
    COALESCE(NEW.raw_user_meta_data->>'section', 'A'),
    COALESCE(NEW.raw_user_meta_data->>'academic_year', 'I'),
    'registered'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    college_id = EXCLUDED.college_id,
    section = EXCLUDED.section,
    academic_year = EXCLUDED.academic_year;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
