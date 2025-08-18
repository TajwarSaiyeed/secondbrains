"use client";

import { useAuthStore } from "@/stores/auth-store";
import { loginUser, clearUserSession } from "@/actions/auth";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    logout: logoutFromStore,
    checkAuth,
  } = useAuthStore();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const result = await loginUser(formData);

      if (result?.error) {
        return {
          success: false,
          error: result.error,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  };

  const logout = async () => {
    try {
      await clearUserSession();

      logoutFromStore();

      await checkAuth();

      router.push("/login");

      return { success: true };
    } catch (error) {
      logoutFromStore();
      await checkAuth();
      router.push("/login");
      return { success: true };
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  };
};
