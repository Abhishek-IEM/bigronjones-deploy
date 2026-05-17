import { useEffect, useState } from "react";
import { authHeaders } from "@/auth/api";
import { supabase } from "@/auth/supabase";

export type TrialStatus = {
  role: "user" | "admin" | "super_admin" | null;
  paymentStatus: string | null;
  programType: string | null;
  hasBookedCalendly: boolean;
  bookingCompleted: boolean;
  bookingTime: string | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  trialCompletedAt: string | null;
  priorityWindowExpiresAt: string | null;
  // Derived
  hasTrial: boolean;
  trialDay: number | null; // 1..7 or null when not started
  trialIsActive: boolean;
  trialIsComplete: boolean;
  isAdmin: boolean; // role is admin OR super_admin
};

const EMPTY: TrialStatus = {
  role: null,
  paymentStatus: null,
  programType: null,
  hasBookedCalendly: false,
  bookingCompleted: false,
  bookingTime: null,
  trialStartDate: null,
  trialEndDate: null,
  trialCompletedAt: null,
  priorityWindowExpiresAt: null,
  hasTrial: false,
  trialDay: null,
  trialIsActive: false,
  trialIsComplete: false,
  isAdmin: false,
};

function deriveDay(start: string | null) {
  if (!start) return null;
  const t = new Date(start).getTime();
  if (Number.isNaN(t)) return null;
  const elapsed = Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(7, elapsed + 1));
}

/**
 * Lightweight trial-state fetcher used by chrome (navbar). Returns EMPTY when
 * the user is signed out or the request fails — so it never throws into the
 * navbar render path.
 */
export function useTrialStatus(): TrialStatus & { loading: boolean } {
  const [state, setState] = useState<TrialStatus>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        if (mounted) {
          setState(EMPTY);
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetch("/api/me", {
          headers: await authHeaders(),
          credentials: "include",
        });
        if (!res.ok) {
          if (mounted) {
            setState(EMPTY);
            setLoading(false);
          }
          return;
        }
        const json = await res.json();
        const u = json.user || {};
        const trialStartDate: string | null = u.trialStartDate ?? null;
        const trialCompletedAt: string | null = u.trialCompletedAt ?? null;
        const role: TrialStatus["role"] = u.role ?? null;
        const next: TrialStatus = {
          role,
          paymentStatus: u.paymentStatus ?? null,
          programType: u.programType ?? null,
          hasBookedCalendly: !!u.hasBookedCalendly,
          bookingCompleted: !!u.bookingCompleted,
          bookingTime: u.bookingTime ?? trialStartDate,
          trialStartDate,
          trialEndDate: u.trialEndDate ?? null,
          trialCompletedAt,
          priorityWindowExpiresAt: u.priorityWindowExpiresAt ?? null,
          hasTrial: u.paymentStatus === "paid" || !!trialStartDate,
          trialDay: deriveDay(trialStartDate),
          trialIsActive: !!trialStartDate && !trialCompletedAt,
          trialIsComplete: !!trialCompletedAt,
          isAdmin: role === "admin" || role === "super_admin",
        };
        if (mounted) {
          setState(next);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setState(EMPTY);
          setLoading(false);
        }
      }
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { ...state, loading };
}
