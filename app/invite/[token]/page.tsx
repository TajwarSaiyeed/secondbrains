import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

type Params = Promise<{ token: string }>;

export default async function InvitePage({ params }: { params: Params }) {
  const { token } = await params;
  const user = await getCurrentUser();

  if (!user) redirect(`/login?invite=${token}`);

  const board = await prisma.board.findFirst({ where: { inviteToken: token } });
  if (!board) {
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

  const isMember = await prisma.boardMember.findFirst({
    where: { boardId: board.id, userId: user.id },
  });
  if (!isMember) {
    await prisma.boardMember.create({
      data: {
        boardId: board.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        role: "member",
        joinedAt: new Date(),
      },
    });
  }

  redirect(`/dashboard/${board.id}`);
}
