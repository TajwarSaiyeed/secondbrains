"use server";

import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function updateSettings(
  settings: Record<string, boolean>,
): Promise<ActionResult<void>> {
  try {
    await fetchAuthMutation(api.users.updateSettings, {
      emailNotifications: settings.emailNotifications,
      aiSuggestions: settings.aiSuggestions,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ActionResult<void>> {
  try {
    return {
      success: false,
      error: "Use Better Auth client for password change",
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteAccount(
  password: string,
): Promise<ActionResult<void>> {
  try {
    return {
      success: false,
      error: "Use Better Auth client for account deletion",
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
