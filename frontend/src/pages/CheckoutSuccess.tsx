import { useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const clearCart = useCart((s) => s.clearCart);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      clearCart();
    }
  }, [clearCart, sessionId]);

  if (!sessionId) {
    return <Navigate to="/checkout" replace />;
  }

  return (
    <>
              <title>Order Confirmed | BigRonJones</title>
        <meta name="description" content="Your BigRonJones order is confirmed." />
      <section className="bg-[#050505] pt-28 pb-24 md:pt-36 md:pb-32">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center bg-[#E8192C]">
            <CheckCircle2 size={36} strokeWidth={2.2} className="text-white" />
          </div>
          <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            — PAYMENT CONFIRMED
          </p>
          <h1
            className="font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
          >
            YOU&apos;RE IN.
            <br />
            <span className="text-[#E8192C]">LET&apos;S GET TO WORK.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl font-['DM_Sans'] text-base leading-relaxed text-white/65">
            Your receipt is on its way. Ron&apos;s team will email your welcome
            materials within 24 hours. For consultations, you&apos;ll receive a
            calendar link separately.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f]"
            >
              Return Home
              <ArrowRight size={13} />
            </Link>
            <Link
              to="/programs"
              className="inline-flex items-center gap-2 border border-[#1a1a1a] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:border-[#E8192C]"
            >
              Explore More
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
