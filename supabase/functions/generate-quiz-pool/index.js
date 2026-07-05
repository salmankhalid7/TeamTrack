// Follow the Supabase Edge Functions structure: 
// - Deno runtime with supabase-js and serve

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Get environment variables
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const GROQ_MODEL = "mixtral-8x7b-32768"; // or "llama3-70b-8192", etc.

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { topic, questionCount = 10, taskIds = [] } = await req.json();

    // Build a prompt for Groq
    let prompt = `You are an expert quiz generator. Generate ${questionCount} multiple-choice questions (MCQs) about the following topic:\n\n"${topic}"\n\n`;
    if (taskIds.length > 0) {
      prompt += `\nThe questions should be based on these specific tasks (IDs: ${taskIds.join(", ")}).\n`;
    }
    prompt += `
Each question must be in JSON format with the following structure:
{
  "question_text": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": 0,  // index of the correct option (0-based)
  "explanation": "Why this is the correct answer"
}
Return ONLY a valid JSON array of these objects. Do not include any additional text or markdown.`;

    // Call Groq API
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }, // if supported, else parse manually
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
    }

    const groqData = await groqResponse.json();
    const content = groqData.choices?.[0]?.message?.content || "";

    // Extract JSON from the content (in case it includes markdown)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let questions;
    if (jsonMatch) {
      questions = JSON.parse(jsonMatch[0]);
    } else {
      // Fallback: try parsing the whole content
      questions = JSON.parse(content);
    }

    // Validate questions structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Generated questions are not a valid array.");
    }

    // Return success
    return new Response(
      JSON.stringify({ success: true, questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});