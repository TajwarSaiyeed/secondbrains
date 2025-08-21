import { auth } from "@/auth";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  const { id, name, email } = session.user as {
    id?: string;
    name?: string | null;
    email?: string | null;
  };
  return { id: id || "", name: name || "", email: email || "" };
}
