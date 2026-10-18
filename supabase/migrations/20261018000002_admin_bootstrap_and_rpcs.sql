-- ============================================================================
-- TECH EXPERT 2K26 — SECURE ADMIN PROVISIONING & SERVER-SIDE RPCS
-- Sri Venkateswara College of Engineering (SVCE)
-- ============================================================================

-- Enable pgcrypto for password hashing if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Helper Function: Calculate Effective Question Timer
-- Inheritance: Question-level timer -> Set-level timer -> Phase-level timer
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_effective_timer(
    p_question_id UUID,
    p_set_id UUID,
    p_phase TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_q_timer INTEGER;
    v_item_timer INTEGER;
    v_set_timer INTEGER;
    v_phase_timer INTEGER;
BEGIN
    -- 1. Check question_set_items override
    SELECT timer_override INTO v_item_timer
    FROM public.question_set_items
    WHERE set_id = p_set_id AND question_id = p_question_id;

    IF v_item_timer IS NOT NULL AND v_item_timer > 0 THEN
        RETURN v_item_timer;
    END IF;

    -- 2. Check question custom_timer
    SELECT custom_timer INTO v_q_timer
    FROM public.questions
    WHERE id = p_question_id;

    IF v_q_timer IS NOT NULL AND v_q_timer > 0 THEN
        RETURN v_q_timer;
    END IF;

    -- 3. Check question set default timer
    SELECT default_timer INTO v_set_timer
    FROM public.question_sets
    WHERE id = p_set_id;

    IF v_set_timer IS NOT NULL AND v_set_timer > 0 THEN
        RETURN v_set_timer;
    END IF;

    -- 4. Check phase default timer
    SELECT default_question_timer INTO v_phase_timer
    FROM public.phase_controls
    WHERE phase = p_phase;

    IF v_phase_timer IS NOT NULL AND v_phase_timer > 0 THEN
        RETURN v_phase_timer;
    END IF;

    RETURN 15; -- Fallback default 15s
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Helper RPC: Get Assigned Question Set for Current Participant
-- Evaluates specific user -> Section & Year -> Section -> Year -> 'all'
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_assigned_question_set(p_phase TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_section TEXT;
    v_year TEXT;
    v_assigned_set_id UUID;
    v_set_record RECORD;
    v_questions JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Get participant profile
    SELECT section, academic_year INTO v_section, v_year
    FROM public.profiles
    WHERE user_id = v_user_id;

    -- Priority 1: Direct Participant Assignment
    SELECT set_id INTO v_assigned_set_id
    FROM public.question_set_assignments a
    JOIN public.question_sets s ON s.id = a.set_id
    WHERE s.phase = p_phase AND s.is_published = true AND a.is_active = true
      AND a.target_type = 'participant' AND a.target_value = v_user_id::text
    LIMIT 1;

    -- Priority 2: Section + Year combination e.g. "A-I"
    IF v_assigned_set_id IS NULL AND v_section IS NOT NULL AND v_year IS NOT NULL THEN
        SELECT set_id INTO v_assigned_set_id
        FROM public.question_set_assignments a
        JOIN public.question_sets s ON s.id = a.set_id
        WHERE s.phase = p_phase AND s.is_published = true AND a.is_active = true
          AND a.target_type = 'section_year' AND a.target_value = (v_section || '-' || v_year)
        LIMIT 1;
    END IF;

    -- Priority 3: Section assignment e.g. "A"
    IF v_assigned_set_id IS NULL AND v_section IS NOT NULL THEN
        SELECT set_id INTO v_assigned_set_id
        FROM public.question_set_assignments a
        JOIN public.question_sets s ON s.id = a.set_id
        WHERE s.phase = p_phase AND s.is_published = true AND a.is_active = true
          AND a.target_type = 'section' AND a.target_value = v_section
        LIMIT 1;
    END IF;

    -- Priority 4: Academic Year assignment e.g. "I"
    IF v_assigned_set_id IS NULL AND v_year IS NOT NULL THEN
        SELECT set_id INTO v_assigned_set_id
        FROM public.question_set_assignments a
        JOIN public.question_sets s ON s.id = a.set_id
        WHERE s.phase = p_phase AND s.is_published = true AND a.is_active = true
          AND a.target_type = 'academic_year' AND a.target_value = v_year
        LIMIT 1;
    END IF;

    -- Priority 5: Fallback to 'all' assignment
    IF v_assigned_set_id IS NULL THEN
        SELECT set_id INTO v_assigned_set_id
        FROM public.question_set_assignments a
        JOIN public.question_sets s ON s.id = a.set_id
        WHERE s.phase = p_phase AND s.is_published = true AND a.is_active = true
          AND a.target_type = 'all'
        LIMIT 1;
    END IF;

    -- Fallback: Any published set for phase
    IF v_assigned_set_id IS NULL THEN
        SELECT id INTO v_assigned_set_id
        FROM public.question_sets
        WHERE phase = p_phase AND is_published = true AND is_archived = false
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    IF v_assigned_set_id IS NULL THEN
        RETURN jsonb_build_object('error', 'No question set currently released for this phase');
    END IF;

    -- Get set details
    SELECT * INTO v_set_record FROM public.question_sets WHERE id = v_assigned_set_id;

    -- Get safe questions (without private fields)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', q.id,
            'phase', q.phase,
            'question_type', q.question_type,
            'title', q.title,
            'problem_statement', q.problem_statement,
            'choices', q.choices,
            'starter_code', q.starter_code,
            'scoring_points', q.scoring_points,
            'difficulty', q.difficulty,
            'tags', q.tags,
            'display_order', i.display_order,
            'effective_timer', public.get_effective_timer(q.id, v_assigned_set_id, p_phase)
        ) ORDER BY i.display_order ASC
    ), '[]'::jsonb) INTO v_questions
    FROM public.question_set_items i
    JOIN public.questions q ON q.id = i.question_id
    WHERE i.set_id = v_assigned_set_id AND q.is_published = true AND q.is_archived = false;

    RETURN jsonb_build_object(
        'set_id', v_set_record.id,
        'set_name', v_set_record.set_name,
        'phase', v_set_record.phase,
        'description', v_set_record.description,
        'default_timer', v_set_record.default_timer,
        'timer_policy', v_set_record.timer_policy,
        'questions', v_questions
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Server-Authoritative Quiz Answer Submission (Phase 1)
-- Evaluates correctness strictly on server; protects correct answers
-- ----------------------------------------------------------------------------
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

    -- Check if already answered
    SELECT EXISTS (
        SELECT 1 FROM public.quiz_responses
        WHERE participant_id = v_user_id AND question_id = p_question_id
    ) INTO v_already_submitted;

    IF v_already_submitted THEN
        RAISE EXCEPTION 'Question has already been answered for this attempt';
    END IF;

    -- Fetch private answers and points securely on server
    SELECT private_correct_answers, scoring_points, COALESCE(custom_timer, 15)
    INTO v_private_answers, v_points, v_effective_timer
    FROM public.questions
    WHERE id = p_question_id;

    IF v_private_answers IS NULL THEN
        RAISE EXCEPTION 'Question not found';
    END IF;

    -- Validate answer: check if selected_answer exists in json array
    IF v_private_answers ? p_selected_answer THEN
        v_is_correct := true;
        v_points_awarded := v_points;
    ELSE
        v_is_correct := false;
        v_points_awarded := 0;
    END IF;

    -- Insert authoritative response
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
    );

    -- Calculate total score for session
    SELECT COALESCE(SUM(points_awarded), 0) INTO v_total_score
    FROM public.quiz_responses
    WHERE participant_id = v_user_id;

    -- Update session score
    UPDATE public.competition_sessions
    SET final_score = v_total_score,
        ended_at = now()
    WHERE id = p_session_id;

    RETURN jsonb_build_object(
        'success', true,
        'is_correct', v_is_correct,
        'points_awarded', v_points_awarded,
        'total_score', v_total_score
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Server-Authoritative Program Attempt Recorder (Phase 2 & Phase 3)
-- Atomic attempt counter, permanent locking after 3 attempts in Phase 3
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_program_attempt(
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
    v_user_id UUID := auth.uid();
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

-- ----------------------------------------------------------------------------
-- 5. Admin Evaluation Override RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_override_evaluation(
    p_run_result_id UUID,
    p_new_decision BOOLEAN,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_run RECORD;
BEGIN
    IF NOT public.is_admin(v_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized: Administrator access required';
    END IF;

    SELECT * INTO v_run FROM public.run_results WHERE id = p_run_result_id;
    IF v_run IS NULL THEN
        RAISE EXCEPTION 'Run result record not found';
    END IF;

    -- Update run result
    UPDATE public.run_results
    SET is_accepted = p_new_decision,
        evaluation_status = 'overridden'
    WHERE id = p_run_result_id;

    -- Update program attempt
    UPDATE public.program_attempts
    SET is_solved = p_new_decision,
        is_locked = CASE WHEN p_new_decision = true THEN false ELSE is_locked END,
        solved_at = CASE WHEN p_new_decision = true THEN now() ELSE NULL END
    WHERE participant_id = v_run.participant_id AND question_id = v_run.question_id;

    -- Insert override record
    INSERT INTO public.evaluation_overrides (
        run_result_id,
        participant_id,
        question_id,
        admin_id,
        previous_decision,
        new_decision,
        reason
    ) VALUES (
        p_run_result_id,
        v_run.participant_id,
        v_run.question_id,
        v_admin_id,
        v_run.is_accepted,
        p_new_decision,
        p_reason
    );

    -- Log admin action
    INSERT INTO public.admin_audit_logs (
        admin_id,
        action,
        target_type,
        target_id,
        change_summary,
        reason
    ) VALUES (
        v_admin_id,
        'EVALUATION_OVERRIDE',
        'run_results',
        p_run_result_id::text,
        format('Changed accepted from %s to %s', v_run.is_accepted, p_new_decision),
        p_reason
    );

    RETURN jsonb_build_object('success', true);
END;
$$;
