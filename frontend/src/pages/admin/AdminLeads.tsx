import { useEffect, useMemo, useState } from "react";
import { CheckCircle, AlertCircle, Download, Mail } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi, type Lead, type ContentItem } from "@/auth/adminApi";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function leadsToCsv(leads: Lead[]): string {
  const header = [
    "Name",
    "Email",
    "Phone",
    "Content",
    "Source",
    "Campaign",
    "Email Sent",
    "Created",
  ];
  const rows = leads.map((l) => [
    l.full_name,
    l.email,
    l.phone || "",
    l.lead_magnets?.title || l.lead_magnet_slug,
    l.utm_source || l.source || "",
    l.utm_campaign || "",
    l.pdf_sent ? "yes" : "no",
    new Date(l.created_at).toISOString(),
  ]);
  const escape = (s: string) =>
    /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  return [header, ...rows]
    .map((row) => row.map((cell) => escape(String(cell))).join(","))
    .join("\n");
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    Promise.all([adminApi.listLeads({ limit: 500 }), adminApi.listContent()])
      .then(([leadsRes, contentRes]) => {
        if (!mounted) return;
        setLeads(leadsRes.items);
        setContent(contentRes.items);
        setError(null);
      })
      .catch((err: Error) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((l) => l.lead_magnet_id === filter);
  }, [filter, leads]);

  function handleExport() {
    const csv = leadsToCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-['DM_Mono'] text-[11px] tracking-[0.3em] text-[#E8192C] mb-1">
            CAPTURED
          </p>
          <h1 className="font-['Bebas_Neue'] text-4xl text-white">ALL LEADS</h1>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-6 py-3 border border-[#1c1c1c] text-white/60 font-['DM_Mono'] text-[10px] tracking-[0.15em] uppercase hover:border-[#E8192C] hover:text-white transition-all disabled:opacity-40"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <span className="font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Filter:
        </span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#0a0a0a] border border-[#1c1c1c] focus:border-[#E8192C] outline-none px-3 py-2 font-['DM_Sans'] text-white text-sm"
        >
          <option value="all">All content</option>
          {content.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <span className="font-['DM_Mono'] text-[10px] tracking-wider text-white/40">
          {filtered.length} of {leads.length}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#E8192C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-[#E8192C]/10 border border-[#E8192C]/30 p-4 font-['DM_Sans'] text-sm text-[#E8192C]">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0d0d0d] border border-[#1c1c1c] p-16 text-center">
          <Mail size={28} className="text-white/20 mx-auto mb-3" />
          <p className="font-['DM_Sans'] text-white/40">
            No leads yet. Share a content link on Instagram to start collecting.
          </p>
        </div>
      ) : (
        <div className="bg-[#0d0d0d] border border-[#1c1c1c] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1c1c1c]">
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Content</Th>
                <Th>Source</Th>
                <Th>Sent</Th>
                <Th>When</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-[#141414] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                >
                  <Td>
                    <span className="font-['DM_Sans'] text-white text-sm">
                      {lead.full_name}
                    </span>
                  </Td>
                  <Td>
                    <a
                      href={`mailto:${lead.email}`}
                      className="font-['DM_Mono'] text-[11px] text-white/70 hover:text-[#E8192C] tracking-wider"
                    >
                      {lead.email}
                    </a>
                  </Td>
                  <Td>
                    <span className="font-['DM_Mono'] text-[11px] text-white/40">
                      {lead.phone || "—"}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-['DM_Sans'] text-xs text-white/60">
                      {lead.lead_magnets?.title || lead.lead_magnet_slug}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-['DM_Mono'] text-[10px] uppercase tracking-wider text-white/40">
                      {lead.utm_source || lead.source || "direct"}
                    </span>
                  </Td>
                  <Td>
                    {lead.pdf_sent ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle size={12} />
                        <span className="font-['DM_Mono'] text-[10px] uppercase tracking-wider">
                          Yes
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-400">
                        <AlertCircle size={12} />
                        <span className="font-['DM_Mono'] text-[10px] uppercase tracking-wider">
                          Pending
                        </span>
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className="font-['DM_Mono'] text-[10px] text-white/30 tracking-wider">
                      {formatDate(lead.created_at)}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 uppercase px-4 py-3">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-middle">{children}</td>;
}
