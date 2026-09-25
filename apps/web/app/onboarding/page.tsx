import { requireUser } from "@/lib/session";

export default async function OnboardingPage() {
  await requireUser();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-bold text-gray-900">You&apos;re not part of an organization yet</h1>
      <p className="mt-2 text-sm text-gray-500">
        Ask your organization admin to invite you, or contact support if you believe this is a mistake.
      </p>
    </div>
  );
}
