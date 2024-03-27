"use client";
import { CreatePost } from "@/app/_components/create-post";
import { api } from "@/trpc/react";
import {
  SignInButton,
  SignOutButton,
  currentUser,
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import getStripe from "@/lib/getStripe";
import { Animated_div, Animated_h1, Animated_p } from "@/lib/animated";
import Stripe from "stripe";
import { cn } from "@/lib/utils";
import LoadingComponent from "../_components/loading";

export default function Home() {
  const { mutate: getCheckoutSession } =
    api.stripe.getCheckoutSession.useMutation({
      onSuccess: async (session: Stripe.Response<Stripe.Checkout.Session>) => {
        const stripe = await getStripe();
        const { error } = await stripe!.redirectToCheckout({
          sessionId: session.id,
        });
      },
    });

  const { user, isLoaded } = useUser();
  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full bg-slate-100">
        <LoadingComponent />
      </div>
    );
  }

  const { data: premiumData, isLoading } = {
    data: { isPremium: false },
    isLoading: false,
  };

  /*

    i hard coded the premium because 
    i can't do the stripe integration on a public page

    you need to work like that:

    const { data: premiumData, isLoading } = api.stripe.getUserSubscription.useQuery({});

    and then you can check if the user is premium or not

  */

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-100">
        <LoadingComponent />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-100 pt-48">
      <div className="z-10 min-h-[50vh] w-full max-w-4xl px-5 xl:px-0">
        <Animated_h1
          className="animate-fade-up bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-center text-7xl font-bold tracking-[-0.02em] text-transparent opacity-0 drop-shadow-sm md:text-8xl/[5rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Balancer> T3 Template App</Balancer>
        </Animated_h1>
        <Animated_p
          className="animate-fade-up mt-6 text-center text-muted-foreground/80 md:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Balancer>
            This is a boilerplate for a fullstack{" "}
            <span className="font-bold">Next.js</span> app i have done
            implementing different template around the web. I have done This
            because every time i try to start a new project i have to do the
            same thing over and over again (and every time something decide to
            don't work...). I promise to keep this updated and to add new stuff
          </Balancer>
        </Animated_p>
        <div>
          {user && !isLoading ? (
            <div className="flex w-full flex-col items-center justify-center gap-3 text-center text-muted-foreground/80 md:text-lg">
              <Animated_p
                className="animate-fade-up text-muted-foreground/800 mt-6 text-center md:text-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Logged in as {user.fullName} and you are{" "}
                <span
                  className={cn(
                    premiumData?.isPremium ? "text-green-500" : "text-red-500",
                  )}
                >
                  {premiumData?.isPremium ? "Premium" : "Not Premium"}
                </span>
              </Animated_p>
              <Animated_div
                className="animate-fade-up flex flex-row items-center justify-between gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SignOutButton>
                  <button className="rounded-lg bg-violet-600 p-3 font-normal text-white">
                    Sign Out
                  </button>
                </SignOutButton>
                <button
                  className={cn(
                    "rounded-lg bg-violet-600 p-3 text-white disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-50",
                    premiumData?.isPremium
                      ? "cursor-not-allowed bg-gray-400 opacity-50"
                      : "",
                  )}
                  disabled={premiumData?.isPremium || !user ? true : false}
                  onClick={
                    () =>
                      getCheckoutSession({ productId: "prod_NrtQkWbBicei7U" }) // This is the price ID of the product we created in the Stripe dashboard
                  }
                >
                  Become Premium
                </button>
              </Animated_div>
            </div>
          ) : (
            <div className="mt-6 flex flex-row items-center justify-center gap-2">
              <p className=" text-center text-black text-muted-foreground/80  md:text-xl">
                You are not logged in
              </p>
              <SignInButton redirectUrl="/sign-in">
                <p className="text-center text-black text-muted-foreground/80 underline transition-colors hover:text-violet-600 md:text-xl ">
                  Sign in Now
                </p>
              </SignInButton>
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-col items-center">
          <CrudShowcase />
        </div>
      </div>
    </main>
  );
}

function CrudShowcase() {
  "use client";
  const { data: latestPost, isLoading } = api.post.getAllPosts.useQuery();

  if (isLoading || !latestPost) {
    return <div>Loading Content...</div>;
  }

  return (
    <div className="w-full max-w-xs">
      <CreatePost />
      <div className="mt-6 flex flex-col">
        <ul className="space-y-2">
          {latestPost.map((post, index) => (
            <li key={index} className="border border-gray-400">
              <p className="text-sm">
                {`Posted by `}
                <span className="text-blue-400">
                  <Link href={`/u/${post.user_id}`}>{post.email}</Link>
                </span>{" "}
                {`on ${post.createdAt.toLocaleDateString()}`}
              </p>
              <p className="text-xl text-pink-500">{post.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
