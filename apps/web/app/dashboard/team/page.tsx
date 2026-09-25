import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@surveymasterai/auth";
import { InviteMemberForm } from "./invite-member-form";
import { formatDate } from "@/lib/format";

export default async function TeamPage() {
  const { org } = await requireOrgContext();

  const [members, invitations] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: org.organizationId, isActive: true },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { organizationId: org.organizationId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const canInvite = can(org.role, "org:invite_members");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="mt-1 text-sm text-gray-500">Manage who has access to {org.organizationName}.</p>
        </div>
      </div>

      {canInvite && <InviteMemberForm />}

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{m.user.name}</td>
                <td className="px-4 py-3 text-gray-500">{m.user.email}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-brand-50 text-brand-700">{m.role.replace("_", " ").toLowerCase()}</span>
                </td>
                <td className="px-4 py-3 text-gray-400">{formatDate(m.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invitations.length > 0 && (
        <div className="card mt-6 p-4">
          <h2 className="text-sm font-semibold text-gray-900">Pending invitations</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between text-gray-600">
                <span>{inv.email}</span>
                <span className="badge bg-gray-100 text-gray-500">{inv.role.replace("_", " ").toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
