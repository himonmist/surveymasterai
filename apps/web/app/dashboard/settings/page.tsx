import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { OrgSettingsForm } from "./org-settings-form";

export default async function SettingsPage() {
  const { org } = await requireOrgContext();
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: org.organizationId } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your organization&apos;s profile and branding.</p>

      <div className="card mt-6 max-w-2xl p-6">
        <OrgSettingsForm
          organization={{
            name: organization.name,
            brandColor: organization.brandColor,
            website: organization.website ?? "",
            industry: organization.industry ?? "",
            logoUrl: organization.logoUrl ?? "",
          }}
          readOnly={org.role !== "ORG_ADMIN"}
        />
      </div>
    </div>
  );
}
