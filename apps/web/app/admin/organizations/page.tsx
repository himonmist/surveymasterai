import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function AdminOrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    include: { subscription: { include: { plan: true } }, _count: { select: { members: true, surveys: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Organizations</h1>
      <p className="mt-1 text-sm text-gray-400">{organizations.length} total organizations on the platform.</p>

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-400">
            <tr>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Surveys</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {organizations.map((org) => (
              <tr key={org.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{org.name}</td>
                <td className="px-4 py-3 text-gray-500">{org.subscription?.plan.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{org._count.members}</td>
                <td className="px-4 py-3 text-gray-500">{org._count.surveys}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-emerald-50 text-emerald-700">{org.subscription?.status ?? "NONE"}</span>
                </td>
                <td className="px-4 py-3 text-gray-400">{formatDate(org.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
