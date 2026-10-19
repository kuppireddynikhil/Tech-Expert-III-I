// Supabase Edge Function: submit-run
// Orchestrates Python code submission, attempt validation, AI evaluation, and persistence
// Sri Venkateswara College of Engineering (SVCE) - Tech Expert 2K26

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

import { corsHeaders, evaluateWithGemini, EvaluationError } from "../_shared/evaluate.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate the caller's JWT using the service-role client. This does not depend on
    // SUPABASE_ANON_KEY (which may be missing/legacy when projects use publishable keys).
    const supabaseAdminAuth = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    // The Supabase gateway has already verified the JWT. Resolve the user id from it,
    // preferring an auth lookup and falling back to the token's own `sub` claim.
    let userId: string | null = null;
    const { data: authData } = await supabaseAdminAuth.auth.getUser(token);
    userId = authData?.user?.id ?? null;
    if (!userId) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (payload?.sub && (!payload.exp || payload.exp * 1000 > Date.now())) userId = payload.sub;
      } catch (_) { /* ignore */ }
    }
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Your login session has expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const user = { id: userId };

    const { question_id, phase, submitted_code } = await req.json();

    if (!question_id || !phase || !submitted_code) {
      return new Response(JSON.stringify({ error: "Missing required submission fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Admin client to read private rubric and enforce attempt limits
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check phase control status
    const { data: phaseCtrl, error: phaseErr } = await supabaseAdmin
      .from("phase_controls")
      .select("status, total_deadline_minutes")
      .eq("phase", phase)
      .single();

    if (phaseErr || !phaseCtrl || phaseCtrl.status !== "active") {
      return new Response(
        JSON.stringify({ error: `Phase ${phase} is currently not active (Status: ${phaseCtrl?.status || 'unknown'})` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1b. Administrator-controlled advancement: only participants advanced by the admin may run
    if (phase === "phase2" || phase === "phase3") {
      const { data: adminRecord } = await supabaseAdmin
        .from("admin_roles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const isAdmin = Boolean(adminRecord);

      if (!isAdmin) {
        const { data: quals } = await supabaseAdmin
          .from("phase_qualifications")
          .select("participant_id, qualified")
          .eq("phase", phase);
        if (!quals || quals.length === 0) {
          return new Response(
            JSON.stringify({ error: `The administrator has not yet published the qualified list for ${phase === "phase2" ? "Phase 2" : "Phase 3"}.` }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (!quals.some((q: any) => q.participant_id === user.id && q.qualified)) {
          return new Response(
            JSON.stringify({ error: `You have not been selected to advance to ${phase === "phase2" ? "Phase 2" : "Phase 3"}.` }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 2. Check participant attempt record
    const { data: attemptRecord } = await supabaseAdmin
      .from("program_attempts")
      .select("attempts_used, is_locked, is_solved")
      .eq("participant_id", user.id)
      .eq("question_id", question_id)
      .maybeSingle();

    if (attemptRecord?.is_locked) {
      return new Response(
        JSON.stringify({ error: "Program is permanently locked. Maximum attempts reached." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (attemptRecord?.is_solved) {
      return new Response(
        JSON.stringify({ error: "Program has already been successfully solved." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // In Phase 3: check if already at 3 attempts
    if (phase === "phase3" && attemptRecord && attemptRecord.attempts_used >= 3) {
      return new Response(
        JSON.stringify({ error: "Maximum attempts (3) already consumed for this program." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch question details with private rubric
    const { data: questionData, error: qError } = await supabaseAdmin
      .from("questions")
      .select("id, title, problem_statement, starter_code, private_evaluation_rubric")
      .eq("id", question_id)
      .single();

    if (qError || !questionData) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const requestId = crypto.randomUUID();

    // 4. Evaluate directly (no function-to-function HTTP hop, which was failing/unreachable)
    let evalResult: any;
    try {
      evalResult = await evaluateWithGemini({
        phase,
        question_id,
        question_title: questionData.title,
        problem_statement: questionData.problem_statement,
        submitted_code,
        starter_code: questionData.starter_code,
        evaluation_rubric: questionData.private_evaluation_rubric,
        request_id: requestId
      });
    } catch (e: any) {
      console.error("AI Evaluate failure:", e);
      return new Response(
        JSON.stringify({
          error: `AI Evaluation service is temporarily unavailable. Attempt was not consumed. (${e.message})`,
          details: e instanceof EvaluationError ? e.details : undefined
        }),
        { status: e instanceof EvaluationError ? e.status : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const isAccepted = Boolean(evalResult.accepted);

    // 5. Persist attempt atomically via database RPC
    const { data: attemptResult, error: recordError } = await supabaseAdmin.rpc(
      "record_program_attempt_for",
      {
        p_user_id: user.id,
        p_question_id: question_id,
        p_phase: phase,
        p_submitted_code: submitted_code,
        p_ai_response: evalResult,
        p_is_accepted: isAccepted,
        p_request_id: requestId
      }
    );

    if (recordError) {
      console.error("Error recording attempt:", recordError);
      return new Response(JSON.stringify({ error: recordError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({
        ...evalResult,
        attempt_status: attemptResult
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Submit-run error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to process run submission" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
