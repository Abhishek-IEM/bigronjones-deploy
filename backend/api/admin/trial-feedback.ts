// GET /api/admin/trial-feedback?status=unread|all
//
// Inbox view of every trial-day completion that has feedback_text. Joined
// with the user's name + email so Ron can triage messages without clicking
// into each user.
import { createServerSupabase } from "../../lib/supabase";
import { requireAdmin } from "../../lib/adminAuth";

export const config = { runtime: "nodejs" };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const filter = url.searchParams.get("status") || "all";

  const supabase = createServerSupabase();
  let q = supabase
    .from("day_completions")
    .select(
      "id, user_id, trial_day, overall_feeling, energy_rating, difficulty_rating, feedback_text, completed_at, ron_viewed, ron_reply, ron_replied_at, users!inner(id, name, email, program_type)",
    )
    .not("feedback_text", "is", null)
    .order("completed_at", { ascending: false })
    .limit(200);

  if (filter === "unread") q = q.eq("ron_viewed", false);
  if (filter === "replied") q = q.not("ron_reply", "is", null);
  if (filter === "unreplied") q = q.is("ron_reply", null);

  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ feedback: data || [], filter });
}
