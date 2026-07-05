// src/api/attendance.js
import { supabase } from "../api/supabase";

export async function markAttendanceViaEdge() {
  try {
    // Get the current session access token
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    if (!token) {
      throw new Error("You are not authenticated. Please log in.");
    }

    const functionUrl = `${supabase.supabaseUrl}/functions/v1/mark-attendance`;

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": supabase.supabaseKey,
      },
      body: JSON.stringify({}),
    });

    // Parse the response body (it should be JSON)
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Unexpected response from server.");
    }

    // If the response is not OK, or the Edge Function returned success: false
    if (!response.ok || data.success === false) {
      const errorMsg = data?.error || data?.message || `HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    // Success – return the data
    return data;
  } catch (err) {
    console.error("Attendance Error:", err);
    // Re‑throw so the UI can catch the clean message
    throw err;
  }
}

// markAttendanceDirect and checkTodayAttendance remain unchanged
export async function markAttendanceDirect(internId, date, status) {
  const { data, error } = await supabase
    .from("attendance")
    .insert({ intern_id: internId, date, status, marked_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return { success: true, data };
}

export async function checkTodayAttendance(internId) {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("intern_id", internId)
    .eq("date", today)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}