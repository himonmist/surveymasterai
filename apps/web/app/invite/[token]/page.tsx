import { prisma } from "@/lib/db";
import { InviteAcceptForm } from "./invite-accept-form";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const invitation = await prisma.invitation.findUnique({
    where: { token: params.token },
    include: { organization: true },
  });

  if (!invitation) {
    return <InvalidInvite message="This invitation link is invalid." />;
  }
  if (invitation.status !== "PENDING") {
    return <InvalidInvite message="This invitation has already been used." />;
  }
  if (invitation.expiresAt < new Date()) {
    return <InvalidInvite message="This invitation has expired. Ask your admin to send a new one." />;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="card p-8">
        <h1 className="text-xl font-bold text-gray-900">Join {invitation.organization.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          You&apos;ve been invited as <span className="font-medium">{invitation.role.replace("_", " ").toLowerCase()}</span>.
        </p>
        <InviteAcceptForm token={params.token} email={invitation.email} needsAccount={!existingUser} />
      </div>
    </div>
  );
}

function InvalidInvite({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-bold text-gray-900">Invitation unavailable</h1>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
    </div>
  );
}
