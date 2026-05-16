import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Send } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  adminApi,
  type TrialAdminFeedbackResponse,
} from "@/auth/adminApi";

const TABS: Array<{ id: "all" | "unread" | "replied" | "unreplied"; label: string }> = [
  { id: "unread", label: "Unread" },
  { id: "unreplied", label: "Unreplied" },
  { id: "replied", label: "Replied" },
  { id: "all", label: "All" },
];

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminTrialFeedback() {
  const [tab, setTab] = useState<"all" | "unread" | "replied" | "unreplied">(
    "unread",
  );
  const [data, setData] = useState<TrialAdminFeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await adminApi.trialFeedback(tab);
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function send(completionId: string) {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await adminApi.trialReply({ completionId, reply: reply.trim() });
      setReply("");
      setOpenId(null);
      await load();
    } finally {
      setSending(false);
    }
  }

  async function markRead(completionId: string) {
    await adminApi.trialMarkRead(completionId);
    await load();
  }

  const items = useMemo(() => data?.feedback ?? [], [data]);

  return (
    <AdminLayout>
      <div className="mb-8">
        <p className="mb-1 font-['DM_Mono'] text-[11px] tracking-[0.3em] text-[#E8192C]">
          FEEDBACK INBOX
        </p>
        <h1 className="font-['Bebas_Neue'] text-4xl text-white">
          MESSAGES FROM YOUR TRIAL.
        </h1>
      </div>

      <div className="mb-6 flex gap-1 border-b border-[#1c1c1c]">
        {TABS.map((t) => {
          const sel = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "px-5 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] transition-colors " +
                (sel
                  ? "border-b-2 border-[#E8192C] text-white"
                  : "border-b-2 border-transparent text-white/40 hover:text-white")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8192C] border-t-transparent" />
        </div>
      ) : error ? (
        <div className="border border-[#E8192C]/30 bg-[#E8192C]/10 p-4 font-['DM_Sans'] text-sm text-[#E8192C]">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="border border-[#1c1c1c] bg-[#0d0d0d] py-16 text-center">
          <MessageSquare size={32} className="mx-auto mb-4 text-white/15" />
          <p className="font-['DM_Sans'] text-sm text-white/45">
            Nothing in this view.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((f) => {
            const open = openId === f.id;
            return (
              <li
                key={f.id}
                className={
                  "border bg-[#0d0d0d] p-5 " +
                  (f.ron_viewed ? "border-[#1c1c1c]" : "border-[#E8192C]/40")
                }
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#E8192C]">
                    Day {f.trial_day}
                  </span>
                  {f.overall_feeling && (
                    <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/45">
                      · feeling {f.overall_feeling}
                    </span>
                  )}
                  {!f.ron_viewed && (
                    <span className="bg-[#E8192C] px-2 py-0.5 font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white">
                      New
                    </span>
                  )}
                  <span className="ml-auto font-['DM_Mono'] text-[9px] tracking-wider text-white/30">
                    {relTime(f.completed_at)}
                  </span>
                </div>

                <p className="mt-3 font-['DM_Sans'] text-[15px] leading-relaxed text-white">
                  "{f.feedback_text}"
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/admin/trial/users/${f.user_id}`}
                    className="font-['DM_Mono'] text-[10px] tracking-wider text-white/45 hover:text-white"
                  >
                    {f.users?.name} · {f.users?.email}
                  </Link>
                  {f.users?.program_type && (
                    <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/30">
                      · {f.users.program_type}
                    </span>
                  )}
                </div>

                {f.ron_reply && (
                  <div className="mt-4 border border-[#E8192C]/30 bg-[#E8192C]/10 p-3">
                    <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#E8192C]">
                      Your Reply{f.ron_replied_at && " · " + relTime(f.ron_replied_at)}
                    </p>
                    <p className="mt-1 text-[14px] leading-relaxed text-white">
                      {f.ron_reply}
                    </p>
                  </div>
                )}

                {!f.ron_reply && (
                  <div className="mt-4">
                    {open ? (
                      <div className="border border-[#1c1c1c] bg-black p-3">
                        <textarea
                          rows={2}
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Reply directly to this member…"
                          className="w-full resize-none bg-transparent font-['DM_Sans'] text-sm text-white outline-none placeholder:text-white/25"
                        />
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setOpenId(null);
                              setReply("");
                            }}
                            className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={sending || !reply.trim()}
                            onClick={() => send(f.id)}
                            className="inline-flex items-center gap-2 bg-[#E8192C] px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f] disabled:opacity-60"
                          >
                            <Send size={12} /> {sending ? "Sending…" : "Send"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setOpenId(f.id)}
                          className="inline-flex items-center gap-2 border border-[#E8192C] px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white hover:bg-[#E8192C]"
                        >
                          <MessageSquare size={12} /> Reply
                        </button>
                        {!f.ron_viewed && (
                          <button
                            onClick={() => markRead(f.id)}
                            className="inline-flex items-center gap-2 border border-[#1c1c1c] px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/45 hover:text-white"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AdminLayout>
  );
}
