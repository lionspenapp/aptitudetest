import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: "Stripe not configured. Set STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = new Stripe(stripeKey);
  const origin = request.headers.get("origin") ?? "http://localhost:3000";
  const priceId = process.env.STRIPE_PRICE_ID;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    customer_email: user.email,
    success_url: `${origin}/dashboard?upgraded=true`,
    cancel_url: `${origin}/dashboard?cancelled=true`,
    metadata: { user_id: user.id },
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "InScribe Premium" },
              unit_amount: 1499,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
  };

  const session = await stripe.checkout.sessions.create(sessionParams);
  return NextResponse.json({ url: session.url });
}
