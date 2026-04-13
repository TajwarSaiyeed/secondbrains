import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { headers } from "next/headers";

import { api } from "@/convex/_generated/api";

export const {
  handler,
  isAuthenticated,
  getToken,
  preloadAuthQuery,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});

export async function getCurrentUser() {
  try {
    const isAuth = await isAuthenticated();
    if (!isAuth) return null;

    return await fetchAuthQuery(api.users.current);
  } catch (error) {
    return null;
  }
}
