"use client";

import { api } from "@/trpc/react";

import Balancer from "react-wrap-balancer";
import { Animated_h1, Animated_p } from "@/lib/animated";

export default function Home() {
  const { data, isLoading } = api.post.hello.useQuery({
    text: "Hello World",
  });
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
          {isLoading ? "Loading..." : data?.greeting}
        </Animated_p>
      </div>
    </main>
  );
}
