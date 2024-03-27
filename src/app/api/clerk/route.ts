import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import Stripe from "stripe";

// remember to add your_url/api/clerk/ to the clerk dashboard

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  const eventType = evt.type;

  switch (eventType) {
    case "user.created":
      const { id } = evt.data;
      let {
        id: userId,
        first_name,
        last_name,
        image_url,
        email_addresses,
      } = payload.data;

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      });

      const stripe_customer = await stripe.customers
        .create({
          email: email_addresses[0].email_address,
          name: `${first_name} ${last_name}`,
          metadata: {
            clerkId: userId,
          },
        })
        .then((customer) => {
          return customer;
        });

      let user = db.user
        .create({
          data: {
            id: userId,
            firstName: first_name ?? " ",
            lastName: last_name ?? " ",
            profileImageUrl: image_url,
            email: email_addresses[0].email_address,
            stripeCustomerId: stripe_customer.id,
          },
        })
        .then((user) => {
          console.log(user);
        });

      console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
      console.log(
        `User with an ID of ${userId} and name of ${first_name} ${last_name}`,
      );
      break;

    case "user.updated":
      const { id: u_id } = evt.data;

      let {
        id: u_userId,
        first_name: u_first_name,
        last_name: u_last_name,
        image_url: u_profile_image_url,
        email_addresses: u_email_addresse,
      } = payload.data;

      let u_user = await db.user.update({
        where: {
          id: u_userId,
        },
        data: {
          firstName: u_first_name,
          lastName: u_last_name,
          profileImageUrl: u_profile_image_url,
          email: u_email_addresse[0].email_address,
        },
      });

      console.log(`Webhook with and ID of ${u_id} and type of ${eventType}`);
      break;

    case "user.deleted":
      const { id: d_id } = evt.data;

      let { id: d_userId } = payload.data;

      let d_user = await db.user.delete({
        where: {
          id: d_userId,
        },
      });
      console.log(`Webhook with and ID of ${d_id} and type of ${eventType}`);
      console.log(`User with an ID of ${d_userId} was deleted`);
      break;

    default:
      console.log(
        `Webhook with and ID of [NotValued] and type of ${eventType}`,
      );
      return new Response("Error occured", {
        status: 400,
      });
  }

  return new Response("", { status: 200 });
}
