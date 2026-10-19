-- ============================================================================
-- Phase advancement (admin-controlled qualification) + service-side attempt recorder
-- ============================================================================

-- 1. Which participants the administrator has advanced into each phase.
--    phase = the phase being unlocked ('phase2' or 'phase3').
--    If no rows exist for a phase, the admin has not published that phase's list yet.
CREATE TABLE IF NOT EXISTS public.phase_qualifications (
    phase TEXT NOT NULL CHECK (phase IN ('phase2', 'phase3')),
    participant_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    qualified BOOLEAN NOT NULL DEFAULT false,
    rank INTEGER,
    score INTEGER,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (phase, participant_id)
);

ALTER TABLE public.phase_qualifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants read own qualification" ON public.phase_qualifications;
CREATE POLICY "Participants read own qualification" ON public.phase_qualifications
    FOR SELECT USING (auth.uid() = participant_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage qualifications" ON public.phase_qualifications;
CREATE POLICY "Admins manage qualifications" ON public.phase_qualifications
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Lets a participant know whether the admin has published a list for a phase at all.
CREATE OR REPLACE FUNCTION public.phase_qualification_published(p_phase TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (SELECT 1 FROM public.phase_qualifications WHERE phase = p_phase);
$$;
GRANT EXECUTE ON FUNCTION public.phase_qualification_published(TEXT) TO authenticated;

-- 2. Attempt recorder callable by the edge function (service role) on behalf of a user.
--    The original record_program_attempt relies on auth.uid(), which is NULL when the
--    edge function uses the service-role client.
CREATE OR REPLACE FUNCTION public.record_program_attempt_for(
    p_user_id UUID,
    p_question_id UUID,
    p_phase TEXT,
    p_submitted_code TEXT,
    p_ai_response JSONB,
    p_is_accepted BOOLEAN,
    p_request_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := p_user_id;
    v_attempt_record RECORD;
    v_new_attempts INTEGER := 1;
    v_is_locked BOOLEAN := false;
    v_is_solved BOOLEAN := false;
    v_run_id UUID;
    v_total_solved_phase3 INTEGER := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Lock attempt record for participant and question
    SELECT * INTO v_attempt_record
    FROM public.program_attempts
    WHERE participant_id = v_user_id AND question_id = p_question_id
    FOR UPDATE;

    IF v_attempt_record IS NOT NULL THEN
        -- Check if already locked
        IF v_attempt_record.is_locked THEN
            RAISE EXCEPTION 'Program is permanently locked. Maximum 3 attempts exceeded.';
        END IF;

        -- Check if already solved
        IF v_attempt_record.is_solved THEN
            RAISE EXCEPTION 'Program has already been successfully solved.';
        END IF;

        v_new_attempts := v_attempt_record.attempts_used + 1;
    ELSE
        v_new_attempts := 1;
    END IF;

    -- Evaluate lock and solve status
    IF p_is_accepted THEN
        v_is_solved := true;
        v_is_locked := false;
    ELSE
        v_is_solved := false;
        -- For Phase 3: Lock if attempts reaches 3
        IF p_phase = 'phase3' AND v_new_attempts >= 3 THEN
            v_is_locked := true;
        END IF;
    END IF;

    -- Upsert attempt record
    INSERT INTO public.program_attempts (
        participant_id,
        question_id,
        phase,
        attempts_used,
        is_solved,
        is_locked,
        first_attempt_at,
        last_attempt_at,
        solved_at
    ) VALUES (
        v_user_id,
        p_question_id,
        p_phase,
        v_new_attempts,
        v_is_solved,
        v_is_locked,
        COALESCE(v_attempt_record.first_attempt_at, now()),
        now(),
        CASE WHEN v_is_solved THEN now() ELSE NULL END
    )
    ON CONFLICT (participant_id, question_id) DO UPDATE SET
        attempts_used = v_new_attempts,
        is_solved = v_is_solved,
        is_locked = v_is_locked,
        last_attempt_at = now(),
        solved_at = CASE WHEN v_is_solved THEN now() ELSE public.program_attempts.solved_at END;

    -- Record Run Result
    INSERT INTO public.run_results (
        participant_id,
        question_id,
        phase,
        submitted_code,
        ai_response,
        is_accepted,
        evaluation_status,
        request_identifier
    ) VALUES (
        v_user_id,
        p_question_id,
        p_phase,
        p_submitted_code,
        p_ai_response,
        p_is_accepted,
        'evaluated',
        p_request_id
    ) RETURNING id INTO v_run_id;

    -- In Phase 3: Check if all 3 programs are solved to declare provisional completion
    IF p_phase = 'phase3' AND v_is_solved THEN
        SELECT COUNT(*) INTO v_total_solved_phase3
        FROM public.program_attempts
        WHERE participant_id = v_user_id AND phase = 'phase3' AND is_solved = true;

        IF v_total_solved_phase3 >= 3 THEN
            UPDATE public.competition_sessions
            SET status = 'completed',
                ended_at = now(),
                is_qualified = true
            WHERE participant_id = v_user_id AND phase = 'phase3';
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'run_id', v_run_id,
        'attempts_used', v_new_attempts,
        'max_attempts', CASE WHEN p_phase = 'phase3' THEN 3 ELSE NULL END,
        'is_solved', v_is_solved,
        'is_locked', v_is_locked,
        'accepted', p_is_accepted
    );
END;
$$;

REVOKE ALL ON FUNCTION public.record_program_attempt_for(UUID, UUID, TEXT, TEXT, JSONB, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_program_attempt_for(UUID, UUID, TEXT, TEXT, JSONB, BOOLEAN, TEXT) TO service_role;
