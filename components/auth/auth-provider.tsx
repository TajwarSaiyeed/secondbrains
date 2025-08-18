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
    if (!isLoading && hasCheckedAuth.current) {
      const isAuthPage = pathname === "/login" || pathname === "/register";
      const isPublicPage = pathname === "/";

      console.log("Auth Provider:", {
        isAuthenticated,
        pathname,
        isAuthPage,
        isPublicPage,
      });

      if (isAuthenticated && isAuthPage) {
        console.log("Redirecting authenticated user to dashboard");
        router.replace("/dashboard");
      } else if (!isAuthenticated && !isAuthPage && !isPublicPage) {
        console.log("Redirecting unauthenticated user to login");
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, hasCheckedAuth]);

  return <>{children}</>;
}
