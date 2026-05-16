import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  PlusCircle,
  LogOut,
  Home as HomeIcon,
  Activity,
  MessageSquare,
} from "lucide-react";
import AdminGuard from "./AdminGuard";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", to: "/admin" },
  { icon: Activity, label: "Trial", to: "/admin/trial" },
  { icon: Users, label: "Trial Users", to: "/admin/trial/users" },
  { icon: MessageSquare, label: "Feedback", to: "/admin/trial/feedback" },
  { icon: FileText, label: "Content", to: "/admin/content" },
  { icon: Users, label: "Leads", to: "/admin/leads" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#050505] flex">
        {/* Sidebar */}
        <aside className="w-[240px] shrink-0 bg-[#0a0a0a] border-r border-[#1c1c1c] flex flex-col">
          <div className="p-6 border-b border-[#1c1c1c]">
            <Link to="/" className="block">
              <p className="font-['Bebas_Neue'] text-white text-[18px] tracking-[0.15em]">
                BIGRONJONES
                <sup
                  style={{
                    fontSize: "0.42em",
                    verticalAlign: "super",
                    lineHeight: 0,
                  }}
                >
                  ®
                </sup>
              </p>
              <p className="font-['DM_Mono'] text-[9px] tracking-[0.2em] text-[#E8192C] mt-1">
                ADMIN PORTAL
              </p>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ icon: Icon, label, to }) => {
              const active =
                pathname === to ||
                (to !== "/admin" && pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={[
                    "flex items-center gap-3 px-4 py-3 font-['DM_Sans'] text-sm transition-all",
                    active
                      ? "bg-[#E8192C]/15 text-white border-l-2 border-[#E8192C]"
                      : "text-white/40 hover:text-white hover:bg-white/5 border-l-2 border-transparent",
                  ].join(" ")}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#1c1c1c]">
            <Link
              to="/admin/content/new"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#E8192C] text-white font-['DM_Mono'] text-[10px] tracking-[0.15em] uppercase hover:bg-[#b50f1f] transition-colors"
            >
              <PlusCircle size={14} />
              New Content
            </Link>
          </div>

          <div className="px-4 pb-4 space-y-2">
            {user?.email && (
              <p
                className="font-['DM_Mono'] text-[9px] tracking-[0.15em] text-white/30 truncate"
                title={user.email}
              >
                {user.email}
              </p>
            )}
            <Link
              to="/"
              className="flex items-center gap-2 py-2 text-white/30 font-['DM_Mono'] text-[10px] tracking-[0.15em] uppercase hover:text-white/60 transition-colors"
            >
              <HomeIcon size={12} />
              Site Home
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 py-2 text-white/30 font-['DM_Mono'] text-[10px] tracking-[0.15em] uppercase hover:text-white/60 transition-colors"
            >
              <LogOut size={12} />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
