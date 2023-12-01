import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/api/trpc(.*)",
    "/",
    "/u/(.*)",
    "/signin(.*)",
    "/sso-callback(.*)",
  ],
  ignoredRoutes: ["/api/clerk(.*)", "/api/stripe/webhooks(.*)"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
