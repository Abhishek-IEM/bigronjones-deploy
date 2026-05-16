// GET /api/admin/leads
//
// Query params:
//   ?content_id=...   filter by lead_magnet
//   ?limit=50         (default 100, max 500)
//   ?offset=0
//
// Returns leads with the linked content title joined in.
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

  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("content_id");
  const limit = Math.min(Number(searchParams.get("limit") || 100), 500);
  const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

  const supabase = createServerSupabase();
  let query = supabase
    .from("leads")
    .select(
      "id, full_name, email, phone, lead_magnet_id, lead_magnet_slug, source, utm_source, utm_campaign, status, pdf_sent, pdf_sent_at, created_at, lead_magnets(title, type)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (contentId) query = query.eq("lead_magnet_id", contentId);

  const { data, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    items: data || [],
    total: count || 0,
    limit,
    offset,
  });
}
