"use server";

import { getCurrentUser } from "@/lib/auth";

export async function checkAuthAction() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Not authenticated", user: null };
    }

    return {
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Auth check error:", error);
    return { success: false, error: "Internal server error", user: null };
  }
}
