import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceSupabaseClient } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook verification failed: ${String(err)}` },
      { status: 400 }
    );
  }

  const supabase = createServiceSupabaseClient();

  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.updated"
  ) {
    const session = event.data.object as Stripe.Checkout.Session & {
      metadata?: { user_id?: string };
    };
    const userId =
      session.metadata?.user_id ??
      (event.data.object as Stripe.Subscription).metadata?.user_id;

    if (userId) {
      await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        tier: "premium",
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : null,
        updated_at: new Date().toISOString(),
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.user_id;
    if (userId) {
      await supabase
        .from("user_subscriptions")
        .update({ tier: "free", updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
