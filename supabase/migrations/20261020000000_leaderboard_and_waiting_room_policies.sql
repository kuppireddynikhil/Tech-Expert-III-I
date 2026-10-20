-- ============================================================================
-- TECH EXPERT 2K26 — LEADERBOARD, WAITING ROOM & REAL-TIME SYNC POLICIES
-- Sri Venkateswara College of Engineering (SVCE)
-- ============================================================================

-- 1. Extend phase_controls for authoritative Pause / Resume tracking
ALTER TABLE public.phase_controls
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_paused_seconds INTEGER NOT NULL DEFAULT 0;

-- 2. Open Read Access on Profiles for Authenticated Users (Enables Live Leaderboards & Waiting Room Counts)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone authenticated can read profiles" ON public.profiles;
CREATE POLICY "Anyone authenticated can read profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());

-- 3. Open Read Access on Quiz Responses for Authenticated Users (Enables Live Phase 1 Leaderboard)
DROP POLICY IF EXISTS "Users manage own quiz responses" ON public.quiz_responses;
CREATE POLICY "Users insert and update own quiz responses" ON public.quiz_responses
    FOR INSERT WITH CHECK (auth.uid() = participant_id OR public.is_admin());

CREATE POLICY "Users update own quiz responses" ON public.quiz_responses
    FOR UPDATE USING (auth.uid() = participant_id OR public.is_admin());

DROP POLICY IF EXISTS "Users read quiz responses for leaderboard" ON public.quiz_responses;
CREATE POLICY "Users read quiz responses for leaderboard" ON public.quiz_responses
    FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());

-- 4. Open Read Access on Program Attempts for Authenticated Users (Enables Live Phase 2 & 3 Leaderboard)
DROP POLICY IF EXISTS "Users view own program attempts" ON public.program_attempts;
DROP POLICY IF EXISTS "Users read program attempts for leaderboard" ON public.program_attempts;
CREATE POLICY "Users read program attempts for leaderboard" ON public.program_attempts
    FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());

-- 5. Open Read Access on Competition Sessions for Authenticated Users
DROP POLICY IF EXISTS "Users manage own sessions" ON public.competition_sessions;
CREATE POLICY "Users insert and update own sessions" ON public.competition_sessions
    FOR INSERT WITH CHECK (auth.uid() = participant_id OR public.is_admin());

CREATE POLICY "Users update own sessions" ON public.competition_sessions
    FOR UPDATE USING (auth.uid() = participant_id OR public.is_admin());

DROP POLICY IF EXISTS "Users read competition sessions for leaderboard" ON public.competition_sessions;
CREATE POLICY "Users read competition sessions for leaderboard" ON public.competition_sessions
    FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());

-- 6. Helper RPC: Waiting Room Participant Count
CREATE OR REPLACE FUNCTION public.get_waiting_room_count(p_phase TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    IF p_phase = 'phase1' THEN
        SELECT COUNT(*) INTO v_count
        FROM public.profiles
        WHERE registration_status != 'disqualified';
    ELSIF p_phase IN ('phase2', 'phase3') THEN
        SELECT COUNT(*) INTO v_count
        FROM public.phase_qualifications
        WHERE phase = p_phase AND qualified = true;
        
        -- Fallback if qualifications not yet published: active profiles
        IF v_count = 0 THEN
            SELECT COUNT(*) INTO v_count
            FROM public.profiles
            WHERE registration_status != 'disqualified';
        END IF;
    ELSE
        SELECT COUNT(*) INTO v_count
        FROM public.profiles
        WHERE registration_status != 'disqualified';
    END IF;

    RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_waiting_room_count(TEXT) TO authenticated, anon;

-- 7. High-Performance Server-Side Phase Leaderboard RPC (Security Definer)
CREATE OR REPLACE FUNCTION public.get_phase_leaderboard(p_phase TEXT, p_run_number INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_leaderboard_visible BOOLEAN;
    v_is_admin BOOLEAN := false;
    v_result JSONB;
BEGIN
    -- Check visibility setting
    SELECT leaderboard_visible INTO v_leaderboard_visible
    FROM public.competition_settings
    LIMIT 1;

    v_is_admin := public.is_admin();

    IF NOT COALESCE(v_leaderboard_visible, true) AND NOT v_is_admin THEN
        RETURN '[]'::jsonb;
    END IF;

    IF p_phase = 'phase1' THEN
        SELECT jsonb_agg(sub) INTO v_result
        FROM (
            SELECT 
                p.user_id,
                p.full_name,
                p.email,
                p.section,
                p.academic_year,
                'phase1' AS phase,
                p_run_number AS run_number,
                COALESCE(SUM(qr.points_awarded), 0)::INTEGER AS score,
                DENSE_RANK() OVER (ORDER BY COALESCE(SUM(qr.points_awarded), 0) DESC, COALESCE(SUM(qr.time_spent_seconds), 0) ASC, p.full_name ASC)::INTEGER AS rank,
                (ROUND(COALESCE(SUM(qr.points_awarded), 0) / 10)::TEXT || ' / ' || COUNT(qr.id)::TEXT || ' Correct') AS detail,
                ROUND(COALESCE(SUM(qr.time_spent_seconds), 0))::INTEGER AS time_spent_seconds
            FROM public.profiles p
            JOIN public.quiz_responses qr ON qr.participant_id = p.user_id
            WHERE p.registration_status != 'disqualified'
              AND (qr.run_number = p_run_number OR qr.run_number IS NULL OR qr.run_number = 1)
            GROUP BY p.user_id, p.full_name, p.email, p.section, p.academic_year
            ORDER BY rank ASC
        ) sub;

    ELSIF p_phase = 'phase2' THEN
        SELECT jsonb_agg(sub) INTO v_result
        FROM (
            SELECT 
                p.user_id,
                p.full_name,
                p.email,
                p.section,
                p.academic_year,
                'phase2' AS phase,
                p_run_number AS run_number,
                (COUNT(CASE WHEN pa.is_solved THEN 1 END) * 30)::INTEGER AS score,
                DENSE_RANK() OVER (ORDER BY COUNT(CASE WHEN pa.is_solved THEN 1 END) DESC, p.full_name ASC)::INTEGER AS rank,
                (COUNT(CASE WHEN pa.is_solved THEN 1 END)::TEXT || ' Solved (' || COALESCE(SUM(pa.attempts_used), 0)::TEXT || ' Attempts)') AS detail
            FROM public.profiles p
            JOIN public.program_attempts pa ON pa.participant_id = p.user_id AND pa.phase = 'phase2'
            WHERE p.registration_status != 'disqualified'
              AND (pa.run_number = p_run_number OR pa.run_number IS NULL OR pa.run_number = 1)
            GROUP BY p.user_id, p.full_name, p.email, p.section, p.academic_year
            ORDER BY rank ASC
        ) sub;

    ELSIF p_phase = 'phase3' THEN
        SELECT jsonb_agg(sub) INTO v_result
        FROM (
            SELECT 
                p.user_id,
                p.full_name,
                p.email,
                p.section,
                p.academic_year,
                'phase3' AS phase,
                p_run_number AS run_number,
                (COUNT(CASE WHEN pa.is_solved THEN 1 END) * 50)::INTEGER AS score,
                COUNT(CASE WHEN pa.is_solved THEN 1 END)::INTEGER AS solved_count,
                MAX(pa.solved_at) AS completed_at,
                DENSE_RANK() OVER (
                    ORDER BY 
                        COUNT(CASE WHEN pa.is_solved THEN 1 END) DESC,
                        CASE WHEN COUNT(CASE WHEN pa.is_solved THEN 1 END) = 3 THEN MAX(pa.solved_at) ELSE '9999-12-31'::TIMESTAMPTZ END ASC,
                        p.full_name ASC
                )::INTEGER AS rank,
                CASE 
                    WHEN COUNT(CASE WHEN pa.is_solved THEN 1 END) = 3 THEN '3 / 3 Solved'
                    ELSE COUNT(CASE WHEN pa.is_solved THEN 1 END)::TEXT || ' / 3 Solved'
                END AS detail
            FROM public.profiles p
            JOIN public.program_attempts pa ON pa.participant_id = p.user_id AND pa.phase = 'phase3'
            WHERE p.registration_status != 'disqualified'
              AND (pa.run_number = p_run_number OR pa.run_number IS NULL OR pa.run_number = 1)
            GROUP BY p.user_id, p.full_name, p.email, p.section, p.academic_year
            ORDER BY rank ASC
        ) sub;
    END IF;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_phase_leaderboard(TEXT, INTEGER) TO authenticated, anon;
