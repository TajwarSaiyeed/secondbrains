"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading || !hasCheckedAuth.current) return;

    // Only move authenticated users away from auth pages.
    const isAuthPage = pathname === "/login" || pathname === "/register";

    // Treat these as publicly accessible (no client redirect for unauthenticated):
    const isPublicPage =
      pathname === "/" ||
      pathname === "/forgot-password" ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/invite");

    if (isAuthenticated && isAuthPage) {
      router.replace("/dashboard");
      return;
    }

    if (!isAuthenticated && (isAuthPage || isPublicPage)) {
      return;
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return <>{children}</>;
}
