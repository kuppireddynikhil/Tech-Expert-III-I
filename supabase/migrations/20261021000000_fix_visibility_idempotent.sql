-- ============================================================================
-- TECH EXPERT 2K26 — FIX: ALL PARTICIPANTS VISIBLE IN WAITING ROOM + LEADERBOARD
-- Safe to run multiple times (idempotent). Run this in the Supabase SQL Editor.
--
-- Why only your own account showed up:
--   The waiting-room count and leaderboard use SECURITY DEFINER functions that can see
--   every participant. If those functions are missing, the app falls back to direct table
--   reads, and the old row-level-security policies only let each user see their OWN rows.
-- ============================================================================

-- 1. Columns the leaderboard relies on (no-ops if they already exist)
ALTER TABLE public.quiz_responses   ADD COLUMN IF NOT EXISTS run_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.program_attempts ADD COLUMN IF NOT EXISTS run_number INTEGER NOT NULL DEFAULT 1;

-- 2. Read policies: any logged-in user can read the rows needed for live counts/leaderboards
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone authenticated can read profiles" ON public.profiles;
CREATE POLICY "Anyone authenticated can read profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());

DROP POLICY IF EXISTS "Users manage own quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Users insert and update own quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Users update own quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Users read quiz responses for leaderboard" ON public.quiz_responses;
CREATE POLICY "Users insert and update own quiz responses" ON public.quiz_responses
    FOR INSERT WITH CHECK (auth.uid() = participant_id OR public.is_admin());
CREATE POLICY "Users update own quiz responses" ON public.quiz_responses
    FOR UPDATE USING (auth.uid() = participant_id OR public.is_admin());
CREATE POLICY "Users read quiz responses for leaderboard" ON public.quiz_responses
    FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());

DROP POLICY IF EXISTS "Users view own program attempts" ON public.program_attempts;
DROP POLICY IF EXISTS "Users read program attempts for leaderboard" ON public.program_attempts;
CREATE POLICY "Users read program attempts for leaderboard" ON public.program_attempts
    FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());

DROP POLICY IF EXISTS "Users manage own sessions" ON public.competition_sessions;
DROP POLICY IF EXISTS "Users insert and update own sessions" ON public.competition_sessions;
DROP POLICY IF EXISTS "Users update own sessions" ON public.competition_sessions;
DROP POLICY IF EXISTS "Users read competition sessions for leaderboard" ON public.competition_sessions;
CREATE POLICY "Users insert and update own sessions" ON public.competition_sessions
    FOR INSERT WITH CHECK (auth.uid() = participant_id OR public.is_admin());
CREATE POLICY "Users update own sessions" ON public.competition_sessions
    FOR UPDATE USING (auth.uid() = participant_id OR public.is_admin());
CREATE POLICY "Users read competition sessions for leaderboard" ON public.competition_sessions
    FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());

-- 3. Waiting-room participant count (counts EVERY non-disqualified participant)
CREATE OR REPLACE FUNCTION public.get_waiting_room_count(p_phase TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    IF p_phase IN ('phase2', 'phase3') THEN
        SELECT COUNT(*) INTO v_count
        FROM public.phase_qualifications
        WHERE phase = p_phase AND qualified = true;
    END IF;

    IF COALESCE(v_count, 0) = 0 THEN
        SELECT COUNT(*) INTO v_count
        FROM public.profiles
        WHERE registration_status != 'disqualified';
    END IF;

    RETURN COALESCE(v_count, 0);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_waiting_room_count(TEXT) TO authenticated, anon;

-- 4. Phase leaderboard covering ALL participants who have scored in that phase.
--    (Restarting a phase clears its rows, so the tables always hold the current run only.)
CREATE OR REPLACE FUNCTION public.get_phase_leaderboard(p_phase TEXT, p_run_number INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_visible BOOLEAN;
    v_result JSONB;
BEGIN
    SELECT leaderboard_visible INTO v_visible FROM public.competition_settings LIMIT 1;
    IF NOT COALESCE(v_visible, true) AND NOT public.is_admin() THEN
        RETURN '[]'::jsonb;
    END IF;

    IF p_phase = 'phase1' THEN
        SELECT jsonb_agg(to_jsonb(t) ORDER BY t.rank, t.full_name) INTO v_result
        FROM (
            SELECT
                p.user_id, p.full_name, p.email, p.section, p.academic_year,
                'phase1'::TEXT AS phase,
                p_run_number AS run_number,
                COALESCE(SUM(qr.points_awarded), 0)::INTEGER AS score,
                (DENSE_RANK() OVER (
                    ORDER BY COALESCE(SUM(qr.points_awarded), 0) DESC,
                             COALESCE(SUM(qr.time_spent_seconds), 0) ASC
                ))::INTEGER AS rank,
                (COUNT(*) FILTER (WHERE qr.is_correct))::TEXT || ' / ' || COUNT(qr.id)::TEXT || ' Correct' AS detail,
                ROUND(COALESCE(SUM(qr.time_spent_seconds), 0))::INTEGER AS time_spent_seconds
            FROM public.profiles p
            JOIN public.quiz_responses qr ON qr.participant_id = p.user_id
            WHERE p.registration_status != 'disqualified'
            GROUP BY p.user_id, p.full_name, p.email, p.section, p.academic_year
        ) t;

    ELSIF p_phase = 'phase2' THEN
        SELECT jsonb_agg(to_jsonb(t) ORDER BY t.rank, t.full_name) INTO v_result
        FROM (
            SELECT
                p.user_id, p.full_name, p.email, p.section, p.academic_year,
                'phase2'::TEXT AS phase,
                p_run_number AS run_number,
                (COUNT(*) FILTER (WHERE pa.is_solved) * 30)::INTEGER AS score,
                (DENSE_RANK() OVER (ORDER BY COUNT(*) FILTER (WHERE pa.is_solved) DESC))::INTEGER AS rank,
                (COUNT(*) FILTER (WHERE pa.is_solved))::TEXT || ' Solved (' || COALESCE(SUM(pa.attempts_used), 0)::TEXT || ' Attempts)' AS detail
            FROM public.profiles p
            JOIN public.program_attempts pa ON pa.participant_id = p.user_id AND pa.phase = 'phase2'
            WHERE p.registration_status != 'disqualified'
            GROUP BY p.user_id, p.full_name, p.email, p.section, p.academic_year
        ) t;

    ELSIF p_phase = 'phase3' THEN
        SELECT jsonb_agg(to_jsonb(t) ORDER BY t.rank, t.full_name) INTO v_result
        FROM (
            SELECT
                p.user_id, p.full_name, p.email, p.section, p.academic_year,
                'phase3'::TEXT AS phase,
                p_run_number AS run_number,
                (COUNT(*) FILTER (WHERE pa.is_solved) * 50)::INTEGER AS score,
                (COUNT(*) FILTER (WHERE pa.is_solved))::INTEGER AS solved_count,
                MAX(pa.solved_at) AS completed_at,
                (DENSE_RANK() OVER (
                    ORDER BY COUNT(*) FILTER (WHERE pa.is_solved) DESC,
                             CASE WHEN COUNT(*) FILTER (WHERE pa.is_solved) = 3
                                  THEN MAX(pa.solved_at) ELSE 'infinity'::TIMESTAMPTZ END ASC
                ))::INTEGER AS rank,
                (COUNT(*) FILTER (WHERE pa.is_solved))::TEXT || ' / 3 Solved' AS detail
            FROM public.profiles p
            JOIN public.program_attempts pa ON pa.participant_id = p.user_id AND pa.phase = 'phase3'
            WHERE p.registration_status != 'disqualified'
            GROUP BY p.user_id, p.full_name, p.email, p.section, p.academic_year
        ) t;
    END IF;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_phase_leaderboard(TEXT, INTEGER) TO authenticated, anon;

-- 5. Make PostgREST pick up the new functions immediately
NOTIFY pgrst, 'reload schema';
