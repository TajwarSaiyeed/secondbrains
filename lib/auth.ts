import { auth } from "@/auth";

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;

  const { id, name, email } = session.user as {
    id?: string;
    name?: string | null;
    email?: string | null;
  };

  if (!id || !isValidObjectId(id)) {
    return null;
  }

  return { id, name: name || "", email: email || "" };
}
