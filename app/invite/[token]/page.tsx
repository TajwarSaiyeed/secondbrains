import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const user = await getCurrentUser();

  if (!user) {
    // Store the invite token in the URL and redirect to login
    redirect(`/login?invite=${token}`);
  }

  let db, board;

  try {
    db = await getDb();

    // Find the board with this invite token
    board = await db.collection("boards").findOne({
      inviteToken: token,
    });
  } catch (error) {
    console.error("Error connecting to database:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600 mb-4">
            Something went wrong processing your invite.
          </p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Invite Link</h1>
          <p className="text-gray-600 mb-4">
            This invite link is invalid or has expired.
          </p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is already a member
  const isMember = board.members?.some(
    (member: { userId: string }) =>
      member.userId.toString() === user._id.toString()
  );

  if (isMember) {
    // User is already a member, redirect to board
    redirect(`/dashboard/${board._id}`);
  }

  // Add user to board members
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.collection("boards") as any).updateOne(
      { _id: board._id },
      {
        $push: {
          members: {
            userId: new ObjectId(user._id),
            name: user.name,
            email: user.email,
            role: "member",
            joinedAt: new Date(),
          },
        },
      }
    );
  } catch (error) {
    console.error("Error adding user to board:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600 mb-4">
            Something went wrong adding you to the board.
          </p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Success - redirect to the board (outside try-catch to avoid catching NEXT_REDIRECT)
  redirect(`/dashboard/${board._id}`);
}
