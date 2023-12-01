import { db } from "@/server/db";
import { IncomingMessage } from "http";
import { buffer } from "micro";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

type StripeMetadata = {
  clerkEmailAddress: string;
  clerkFullName: string;
  clerkId: string;
};

// remember to add your_url/api/stripe/webhooks to the stripe dashboard

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") as string;
  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) return;
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.log(`❌ Error message: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const paymentIntent = event.data.object as Stripe.Checkout.Session;
    console.log(
      `🔔 Stripe PaymentIntent status 💸: ${paymentIntent.payment_status}`,
    );
    const { clerkId, clerkFullName, clerkEmailAddress } =
      paymentIntent.metadata as StripeMetadata;

    db.user.update({
      where: { id: clerkId },
      data: {
        isPremium: true,
        PremiumUntil: new Date(
          new Date().setMonth(new Date().getMonth() + 1),
        ).toISOString(),
      },
    });
  } else
    console.warn(`💸 Stripe Webhook : Unhandled event type: ${event.type}`);

  return new Response(JSON.stringify({ received: true }));
}

// export
