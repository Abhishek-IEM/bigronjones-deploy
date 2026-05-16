import type Stripe from "stripe";
import { createRequire } from "node:module";
import { createServerSupabase } from "../lib/supabase";
import { getAuthenticatedUser } from "../lib/auth";

const require = createRequire(import.meta.url);

type LineItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type CheckoutBody = {
  items?: LineItem[];
  total?: number;
  successUrl?: string;
  cancelUrl?: string;
  checkoutType?: "trial" | "phase2";
  plan?: "full" | "six" | "thirtySix";
  programType?: "mens" | "womens";
  email?: string;
  name?: string;
};

const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

console.log("[checkout] Module loaded", {
  hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
  secretKeyPrefix: process.env.STRIPE_SECRET_KEY
    ? `${process.env.STRIPE_SECRET_KEY.slice(0, 5)}...`
    : "missing",
  stripeInitialized: !!stripe,
});

export const config = { runtime: "nodejs" };

function checkoutLine(
  checkoutType: CheckoutBody["checkoutType"],
  plan: CheckoutBody["plan"],
  programType?: CheckoutBody["programType"],
) {
  if (checkoutType === "phase2") {
    const plans = {
      full: {
        name: "BigRonJones Phase 2 Coaching - Paid in Full",
        unitAmount: 300000,
      },
      six: {
        name: "BigRonJones Phase 2 Coaching - 6-Payment Plan",
        unitAmount: 50000,
      },
      thirtySix: {
        name: "BigRonJones Phase 2 Coaching - 36-Payment Plan",
        unitAmount: 13300,
      },
    };
    return plans[plan || "full"];
  }

  const programLabel =
    programType === "mens"
      ? " — Men's"
      : programType === "womens"
        ? " — Women's"
        : "";
  return {
    name: `7-Day Oversight Trial${programLabel}`,
    unitAmount: 14900,
  };
}

async function upsertTrialUser(
  email: string | null | undefined,
  name: string | null | undefined,
  programType: CheckoutBody["programType"] | undefined,
  stripeSessionId: string | null,
  authUserId: string | null,
) {
  if (!email) return;
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) return;
  const supabase = createServerSupabase();
  const updates: Record<string, unknown> = {
    email: cleanEmail,
    name: (name && name.trim()) || cleanEmail.split("@")[0],
    payment_status: "pending",
    updated_at: new Date().toISOString(),
  };
  if (programType) updates.program_type = programType;
  if (stripeSessionId) updates.stripe_session_id = stripeSessionId;
  if (authUserId) updates.auth_user_id = authUserId;
  const { error } = await supabase
    .from("users")
    .upsert(updates, { onConflict: "email" });
  if (error) {
    console.error("[checkout] Failed to upsert trial user:", error.message);
  }
}

export default async function handler(req: Request): Promise<Response> {
  console.log("[checkout] Request:", { method: req.method, url: req.url });

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Auth is optional for checkout — Stripe collects the customer email at the
  // gateway. When a Bearer token is present we attach the user to metadata so
  // post-purchase logic can reconcile orders to accounts.
  type AuthSession = Awaited<ReturnType<typeof getAuthenticatedUser>>;
  let appUser: AuthSession["appUser"] | null = null;
  let authUserId: string | null = null;
  try {
    const session = await getAuthenticatedUser(req);
    appUser = session.appUser;
    authUserId = session.authUser.id;
  } catch (error) {
    if (error instanceof Response && error.status !== 401) return error;
    console.warn(
      "[checkout] proceeding as guest:",
      error instanceof Error ? error.message : "no session",
    );
  }

  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
    console.log("[checkout] req.body:", body);
  } catch (err) {
    console.error("[checkout] JSON parse error:", err);
    try {
      const raw = req.headers.get("x-raw-body");
      if (raw) console.error("[checkout] Raw body (x-raw-body):", raw);
    } catch (e) {
      /* ignore */
    }
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // For trial checkouts the cart is implicit ($149) — synthesize a single line
  // item if the caller didn't pass one. Phase 2 callers always pass items.
  const checkoutType = body.checkoutType || "trial";
  let items = (body.items || []).filter(
    (i) => i && typeof i.price === "number" && i.quantity > 0,
  );

  if (items.length === 0 && checkoutType === "trial") {
    items = [
      {
        id: "trial-149",
        slug: `trial-${body.programType || "general"}`,
        name: "7-Day Oversight Trial",
        price: 149,
        quantity: 1,
      },
    ];
  }

  if (items.length === 0) {
    console.warn("[checkout] No items in cart");
    return Response.json({ error: "Cart is empty" }, { status: 400 });
  }

  const computedTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const requestedTotal =
    typeof body.total === "number" ? body.total : computedTotal;

  console.log("[checkout] Cart total:", {
    requestedTotal,
    computedTotal,
    itemsCount: items.length,
    userId: appUser?.id ?? "(guest)",
  });

  if (requestedTotal <= 0 || computedTotal <= 0) {
    return Response.json(
      { error: "Checkout total must be greater than zero" },
      { status: 400 },
    );
  }

  if (!stripe) {
    console.error("[checkout] STRIPE_SECRET_KEY not configured");
    return Response.json(
      {
        error:
          "Stripe is not configured. Set STRIPE_SECRET_KEY on the backend.",
      },
      { status: 500 },
    );
  }

  // Vite dev server runs on :3000, backend on :8081 — for the success/cancel
  // URLs we want the user-facing origin, not the API origin.
  //
  // SITE_URL is the canonical PRODUCTION url (used for sitemap/canonical
  // tags), so it MUST NOT be used for Stripe redirects in dev — that would
  // bounce the user to bigronjones.com after a localhost test purchase.
  // VITE_SITE_URL is the user-facing app origin (localhost in dev,
  // production domain in prod). Prefer it.
  const isProduction = process.env.NODE_ENV === "production";
  const baseUrl = isProduction
    ? process.env.VITE_SITE_URL ||
      process.env.SITE_URL ||
      "http://localhost:3000"
    : process.env.VITE_SITE_URL || "http://localhost:3000";
  const line = checkoutLine(checkoutType, body.plan, body.programType);

  try {
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: line.name },
            unit_amount: line.unitAmount,
          },
          quantity: 1,
        },
      ],
      ...(appUser
        ? { customer_email: appUser.email }
        : body.email
          ? { customer_email: body.email.toLowerCase().trim() }
          : {}),
      success_url:
        body.successUrl ||
        (checkoutType === "trial"
          ? `${baseUrl}/trial/success?session_id={CHECKOUT_SESSION_ID}`
          : `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`),
      cancel_url:
        body.cancelUrl ||
        (checkoutType === "trial"
          ? `${baseUrl}/programs/trial`
          : `${baseUrl}/cancel`),
      metadata: {
        source: "bigronjones_website",
        checkoutType,
        plan: checkoutType === "phase2" ? body.plan || "full" : "trial",
        programType: body.programType || "",
        userId: appUser?.id ?? "guest",
        userEmail: appUser?.email ?? body.email ?? "",
        items: items.map((i) => `${i.slug}x${i.quantity}`).join(","),
      },
    };

    console.log("[checkout] Creating Stripe checkout session:", {
      userId: appUser?.id ?? "(guest)",
      checkoutType,
      successUrl: sessionConfig.success_url,
      cancelUrl: sessionConfig.cancel_url,
    });

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log("[checkout] Stripe session creation response:", session);

    if (appUser) {
      await saveOrder(appUser.id, items, requestedTotal, session.id).catch(
        (saveErr) => {
          console.error("[checkout] Failed to save Stripe order:", saveErr);
        },
      );
    }

    // For trial checkouts, pre-create / update the trial user record so the
    // Calendly webhook can find them by email after they book the discovery
    // call. Email comes from the auth session, the request body, or the
    // Stripe customer_email — whichever is available.
    if (checkoutType === "trial") {
      const trialEmail = appUser?.email || body.email || null;
      const trialName = appUser?.name || body.name || null;
      await upsertTrialUser(
        trialEmail,
        trialName,
        body.programType,
        session.id,
        authUserId,
      );
    }

    return Response.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    if (err instanceof Error) {
      console.error("[checkout] Full error stack:", err.stack);
    }

    return Response.json(
      { error: err instanceof Error ? err.message : "Payment setup failed" },
      { status: 500 },
    );
  }
}

async function saveOrder(
  userId: string,
  items: LineItem[],
  total: number,
  stripeSessionId: string | null,
) {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("orders")
    .insert([
      {
        user_id: userId,
        items,
        total,
        status: "pending",
        stripe_session_id: stripeSessionId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("[checkout] Supabase order save error:", error);
    throw new Error(`Failed to save order: ${error.message}`);
  }

  console.log("[checkout] Order saved:", { orderId: data?.id });
  return data;
}
