import { z } from "zod";
import Stripe from "stripe";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { currentUser } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

/*
  In This file you can add another procedure like this:
    Remove Subscription -> andrà a rimuovere la sottoscrizione dell'utente ma l'utente rimarrà premium fino alla fine del periodo
    ecc...
*/

export const stripeRouter = createTRPCRouter({
  getCheckoutSession: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await currentUser();

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not signed in.",
        });
      }

      const userData = await ctx.db.user.findUnique({
        where: {
          id: ctx.session.userId,
        },
        select: {
          stripeCustomerId: true,
        },
      });

      if (!ctx.session.userId || !userData?.stripeCustomerId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            "You are not signed in or you don't have a Stripe account, contact support.",
        });
      }

      const plan = await stripe.plans.create({
        amount: 2000,
        currency: "eur",
        interval: "month",
        product: input.productId,
      });

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        billing_address_collection: "required",
        line_items: [
          {
            price: plan.id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        customer: userData.stripeCustomerId,
        success_url:
          process.env.NEXT_PUBLIC_WEBSITE_URL +
          `?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: process.env.NEXT_PUBLIC_WEBSITE_URL,
        metadata: {
          clerkId: user.id,
          clerkEmailAddress: user.emailAddresses[0]!.emailAddress,
          clerkFullName: user.firstName + " " + user.lastName ?? "",
        },
      });

      if (checkoutSession) {
        return checkoutSession;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong, contact support.",
      });
    }),

  getUserSubscription: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const userData = await ctx.db.user.findUnique({
        where: {
          id: ctx.session.userId,
        },
        select: {
          stripeCustomerId: true,
          isPremium: true,
          PremiumUntil: true,
        },
      });

      if (!ctx.session.userId || !userData?.stripeCustomerId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            "You are not signed in or you don't have a Stripe account, contact support.",
        });
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: userData.stripeCustomerId,
      });

      for (const subscription of subscriptions.data) {
        if (
          subscription.status === "active" ||
          subscription.status === "trialing" ||
          subscription.status === "past_due"
        ) {
          return {
            isPremium: true,
            PremiumUntil: subscription.current_period_end,
          };
        }
      }

      return {
        isPremium: false,
        PremiumUntil: null,
      };
    }),
});
