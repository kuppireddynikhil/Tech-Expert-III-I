-- ============================================================================
-- TECH EXPERT 2K26 — WAITING ROOM, EXAM START, AND RUN RESTART MIGRATION
-- Sri Venkateswara College of Engineering (SVCE)
-- ============================================================================

-- 1. Extend phase_controls to separate Phase Activation from Exam Start
ALTER TABLE public.phase_controls
ADD COLUMN IF NOT EXISTS is_activated BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS exam_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_run_number INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS active_question_set_id UUID REFERENCES public.question_sets(id);

-- 2. Extend competition_sessions for run-tracking and safe archiving
ALTER TABLE public.competition_sessions
ADD COLUMN IF NOT EXISTS run_number INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- 3. Extend quiz_responses for run-tracking
ALTER TABLE public.quiz_responses
ADD COLUMN IF NOT EXISTS run_number INTEGER NOT NULL DEFAULT 1;

-- 4. Extend program_attempts for run-tracking
ALTER TABLE public.program_attempts
ADD COLUMN IF NOT EXISTS run_number INTEGER NOT NULL DEFAULT 1;

-- 5. Extend run_results for run-tracking
ALTER TABLE public.run_results
ADD COLUMN IF NOT EXISTS run_number INTEGER NOT NULL DEFAULT 1;

-- 6. Dedicated Table to Archive Completed / Restarted Runs for Auditing
CREATE TABLE IF NOT EXISTS public.archived_phase_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase TEXT NOT NULL CHECK (phase IN ('phase1', 'phase2', 'phase3')),
    run_number INTEGER NOT NULL,
    question_set_id UUID REFERENCES public.question_sets(id),
    archived_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_by UUID REFERENCES auth.users(id),
    session_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    quiz_responses_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    attempts_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    leaderboard_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    reason TEXT
);

ALTER TABLE public.archived_phase_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage archived_phase_runs" ON public.archived_phase_runs;
CREATE POLICY "Admins can manage archived_phase_runs" ON public.archived_phase_runs
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Participants can read archived_phase_runs" ON public.archived_phase_runs;
CREATE POLICY "Participants can read archived_phase_runs" ON public.archived_phase_runs
    FOR SELECT USING (true);
