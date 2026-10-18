-- ============================================================================
-- TECH EXPERT 2K26 — SINGLE EXAM ATTEMPT & ADMIN RE-ENTRY MIGRATION
-- Adds minimal columns to competition_sessions for authoritative re-entry tracking
-- Updates submit_quiz_answer RPC to return correct answers post-timer expiry
-- ============================================================================

-- 1. Minimal Backward-Compatible Columns for competition_sessions
ALTER TABLE public.competition_sessions
ADD COLUMN IF NOT EXISTS reentry_status TEXT NOT NULL DEFAULT 'none' CHECK (reentry_status IN ('none', 'requested', 'approved_resume', 'approved_fresh', 'rejected')),
ADD COLUMN IF NOT EXISTS reentry_reason TEXT,
ADD COLUMN IF NOT EXISTS current_question_index INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_question_started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

-- 2. Ensure RLS Policy allows admin to update re-entry and users to view/manage their session
DROP POLICY IF EXISTS "Users manage own sessions" ON public.competition_sessions;
CREATE POLICY "Users manage own sessions" ON public.competition_sessions
    FOR ALL USING (auth.uid() = participant_id OR public.is_admin());

-- 3. Updated Authoritative submit_quiz_answer RPC
-- Returns 'correct_answers' strictly after submission/timer expiration
CREATE OR REPLACE FUNCTION public.submit_quiz_answer(
    p_session_id UUID,
    p_question_id UUID,
    p_selected_answer TEXT,
    p_time_spent NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_session_status TEXT;
    v_is_locked BOOLEAN;
    v_private_answers JSONB;
    v_points INTEGER;
    v_effective_timer INTEGER;
    v_is_correct BOOLEAN := false;
    v_points_awarded INTEGER := 0;
    v_total_score INTEGER := 0;
    v_already_submitted BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Validate session is active and not locked
    SELECT status, is_locked INTO v_session_status, v_is_locked
    FROM public.competition_sessions
    WHERE id = p_session_id AND participant_id = v_user_id;

    IF v_session_status IS NULL THEN
        RAISE EXCEPTION 'Competition session not found';
    END IF;

    IF v_is_locked THEN
        RAISE EXCEPTION 'Exam session is locked. Administrator re-entry approval is required.';
    END IF;

    -- Fetch private answers and points securely on server
    SELECT private_correct_answers, scoring_points, COALESCE(custom_timer, 15)
    INTO v_private_answers, v_points, v_effective_timer
    FROM public.questions
    WHERE id = p_question_id;

    IF v_private_answers IS NULL THEN
        RAISE EXCEPTION 'Question not found';
    END IF;

    -- Validate answer against correct answers array
    IF p_selected_answer <> 'NONE' AND v_private_answers ? p_selected_answer THEN
        v_is_correct := true;
        v_points_awarded := v_points;
    ELSE
        v_is_correct := false;
        v_points_awarded := 0;
    END IF;

    -- Authoritative upsert response
    INSERT INTO public.quiz_responses (
        session_id,
        participant_id,
        question_id,
        selected_answer,
        is_correct,
        points_awarded,
        effective_timer,
        time_spent_seconds,
        submitted_at
    ) VALUES (
        p_session_id,
        v_user_id,
        p_question_id,
        p_selected_answer,
        v_is_correct,
        v_points_awarded,
        v_effective_timer,
        p_time_spent,
        now()
    )
    ON CONFLICT (participant_id, question_id) DO UPDATE
    SET selected_answer = EXCLUDED.selected_answer,
        is_correct = EXCLUDED.is_correct,
        points_awarded = EXCLUDED.points_awarded,
        effective_timer = EXCLUDED.effective_timer,
        time_spent_seconds = EXCLUDED.time_spent_seconds,
        session_id = EXCLUDED.session_id,
        submitted_at = now();

    -- Calculate total score for session
    SELECT COALESCE(SUM(points_awarded), 0) INTO v_total_score
    FROM public.quiz_responses
    WHERE participant_id = v_user_id;

    -- Update session score
    UPDATE public.competition_sessions
    SET final_score = v_total_score
    WHERE id = p_session_id;

    -- Return full result including correct_answers strictly after finalization
    RETURN jsonb_build_object(
        'success', true,
        'is_correct', v_is_correct,
        'points_awarded', v_points_awarded,
        'total_score', v_total_score,
        'correct_answers', v_private_answers
    );
END;
$$;
