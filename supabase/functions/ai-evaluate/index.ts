// Supabase Edge Function: ai-evaluate
// Thin HTTP wrapper around the shared Gemini evaluator (also used directly by submit-run).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, evaluateWithGemini, EvaluationError } from "../_shared/evaluate.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    if (!payload.submitted_code) {
      return new Response(JSON.stringify({ error: "No code provided for evaluation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const result = await evaluateWithGemini(payload);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("Evaluation handler error:", err);
    const status = err instanceof EvaluationError ? err.status : 500;
    return new Response(
      JSON.stringify({ error: err.message || "Internal evaluation error", status: "failed", details: err.details }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
