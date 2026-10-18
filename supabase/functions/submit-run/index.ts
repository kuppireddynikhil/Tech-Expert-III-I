// Supabase Edge Function: submit-run
// Orchestrates Python code submission, attempt validation, AI evaluation, and persistence
// Sri Venkateswara College of Engineering (SVCE) - Tech Expert 2K26

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client with user's JWT to identify caller
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

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

    // 4. Delegate to AI evaluation function
    const evaluateUrl = `${supabaseUrl}/functions/v1/ai-evaluate`;
    const evalResponse = await fetch(evaluateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        phase,
        question_id,
        question_title: questionData.title,
        problem_statement: questionData.problem_statement,
        submitted_code,
        starter_code: questionData.starter_code,
        evaluation_rubric: questionData.private_evaluation_rubric,
        request_id: requestId
      })
    });

    if (!evalResponse.ok) {
      const evalError = await evalResponse.text();
      console.error("AI Evaluate failure:", evalError);
      return new Response(
        JSON.stringify({
          error: "AI Evaluation service is temporarily unavailable. Attempt was not consumed.",
          details: evalError
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const evalResult = await evalResponse.json();
    const isAccepted = Boolean(evalResult.accepted);

    // 5. Persist attempt atomically via database RPC
    const { data: attemptResult, error: recordError } = await supabaseAdmin.rpc(
      "record_program_attempt",
      {
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
