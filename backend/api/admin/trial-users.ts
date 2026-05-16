// GET /api/admin/trial-users
//   Returns the full trial-user list with per-user trial state + a couple of
//   computed fields the UI uses to filter (active/completed/awaiting/etc).
//
// GET /api/admin/trial-users?id=<uuid>
//   Returns ONE user with their full trial picture: metrics, completions,
//   activity log. Powers /admin/trial/users/:id detail page.
import { createServerSupabase } from "../../lib/supabase";
import { requireAdmin } from "../../lib/adminAuth";

export const config = { runtime: "nodejs" };

type UserRow = {
  id: string;
  email: string;
  name: string;
  program_type: string | null;
  payment_status: string | null;
  has_booked_calendly: boolean | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  trial_completed_at: string | null;
  priority_window_expires_at: string | null;
  converted_to_paid: boolean | null;
  created_at: string;
};

function trialDay(start?: string | null) {
  if (!start) return null;
  const elapsed = Math.floor(
    (Date.now() - new Date(start).getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(1, Math.min(7, elapsed + 1));
}

function status(u: UserRow): string {
  if (u.converted_to_paid) return "converted";
  if (u.trial_completed_at) return "completed";
  if (u.has_booked_calendly && u.trial_start_date) return "active";
  if (u.payment_status === "paid") return "awaiting_calendly";
  return "lead";
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const supabase = createServerSupabase();

  // ── Single user detail mode ────────────────────────────────────────────
  if (id) {
    const [
      { data: user, error: userErr },
      { data: completions },
      { data: metrics },
      { data: activity },
    ] = await Promise.all([
      supabase
        .from("users")
        .select(
          "id, email, name, program_type, payment_status, has_booked_calendly, trial_start_date, trial_end_date, trial_completed_at, priority_window_expires_at, converted_to_paid, created_at, stripe_session_id, calendly_event_id",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("day_completions")
        .select("*")
        .eq("user_id", id)
        .order("trial_day", { ascending: true }),
      supabase
        .from("recovery_metrics")
        .select("*")
        .eq("user_id", id)
        .order("metric_date", { ascending: true }),
      supabase
        .from("user_activity_log")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (userErr) {
      return Response.json({ error: userErr.message }, { status: 500 });
    }
    if (!user) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({
      user: { ...user, status: status(user as UserRow), trialDay: trialDay(user.trial_start_date) },
      completions: completions || [],
      metrics: metrics || [],
      activity: activity || [],
    });
  }

  // ── List mode ──────────────────────────────────────────────────────────
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const filter = url.searchParams.get("status") || "";

  let query = supabase
    .from("users")
    .select(
      "id, email, name, program_type, payment_status, has_booked_calendly, trial_start_date, trial_end_date, trial_completed_at, priority_window_expires_at, converted_to_paid, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let users = (data || []).map((u) => ({
    ...u,
    status: status(u as UserRow),
    trialDay: trialDay(u.trial_start_date),
  }));
  if (filter) users = users.filter((u) => u.status === filter);

  // Lightweight counts per status (post-filter ignored — full picture).
  const counts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.status] = (acc[u.status] || 0) + 1;
    return acc;
  }, {});

  return Response.json({ users, counts, total: users.length });
}
