import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";

export default async function ThankYouPage({ params }: { params: { slug: string } }) {
  const survey = await prisma.survey.findUnique({ where: { slug: params.slug } });
  const thankYou = (survey?.thankYouScreen as { title?: string; description?: string } | null) ?? {};

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      <h1 className="mt-4 text-2xl font-bold text-gray-900">{thankYou.title || "Thank you!"}</h1>
      <p className="mt-2 text-sm text-gray-500">
        {thankYou.description || "Your response has been recorded."}
      </p>
    </div>
  );
}
