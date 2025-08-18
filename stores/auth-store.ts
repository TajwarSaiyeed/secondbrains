import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isChecking: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      isChecking: false,

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          isChecking: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isChecking: false,
        });
      },

      checkAuth: async () => {
        const { isChecking } = get();

        if (isChecking) {
          console.log("Auth check already in progress, skipping...");
          return;
        }

        set({ isLoading: true, isChecking: true });

        try {
          const { checkAuthAction } = await import("@/actions/check-auth");
          const result = await checkAuthAction();

          console.log("Auth check result:", result);

          if (result.success && result.user) {
            const user: User = {
              _id: result.user._id,
              name: result.user.name,
              email: result.user.email,
            };
            console.log("Setting authenticated user:", user);
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              isChecking: false,
            });
          } else {
            console.log("No authenticated user found");
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isChecking: false,
            });
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isChecking: false,
          });
        }
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
