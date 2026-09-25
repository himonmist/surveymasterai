import Link from "next/link";
import { Sparkles, BarChart3, MessageCircleQuestion, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-12 text-white lg:flex">
        <div>
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 font-bold">S</span>
            SurveyMasterAI
          </Link>
          <h1 className="mt-16 text-4xl font-bold leading-tight">
            The intelligent survey platform for modern teams.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Create professional surveys with AI, collect responses at scale, and discover insights that drive
            decisions.
          </p>
        </div>
        <ul className="space-y-4 text-sm text-brand-50">
          <li className="flex items-center gap-3">
            <Sparkles className="h-5 w-5" /> Generate surveys in seconds with AI
          </li>
          <li className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5" /> Real-time analytics and dashboards
          </li>
          <li className="flex items-center gap-3">
            <MessageCircleQuestion className="h-5 w-5" /> Ask AI questions about your data
          </li>
          <li className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5" /> Enterprise-grade security and compliance
          </li>
        </ul>
      </div>
      <div className="flex w-full items-center justify-center bg-white p-8 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
