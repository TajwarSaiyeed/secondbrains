"use server";

import { signOut } from "@/auth";

export async function logoutUser(_: FormData) {
  await signOut({ redirectTo: "/login" });
}
