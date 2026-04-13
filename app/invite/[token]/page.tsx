import { redirect } from "next/navigation";
import { isAuthenticated, fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

type Params = Promise<{ token: string }>;

export default async function InvitePage({ params }: { params: Params }) {
  const { token } = await params;
  const isAuth = await isAuthenticated();

  if (!isAuth) redirect(`/login?invite=${token}`);

  try {
    const boardId = await fetchAuthMutation(api.boards.joinViaInviteToken, {
      token,
    });

    if (boardId) {
      redirect(`/dashboard/${boardId}`);
    }
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Invite Link</h1>
          <p className="text-muted-foreground mb-4">
            This invite link is invalid or has expired.
          </p>
          <Link href="/dashboard" className="text-primary hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }
}
