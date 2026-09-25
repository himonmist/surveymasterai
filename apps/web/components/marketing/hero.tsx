import Link from "next/link";
import { Sparkles, ArrowRight, PlayCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white px-6 pb-20 pt-16 sm:pt-24">
      <div className="mx-auto max-w-4xl text-center">
        <span className="badge mb-6 gap-1.5 border border-brand-200 bg-brand-50 text-brand-700">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Survey Intelligence
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Create Smarter Surveys.
          <br />
          <span className="text-brand-600">Discover Better Insights.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
          Create, publish, analyze and understand every survey with AI. From a single sentence to a professional
          questionnaire in seconds.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            <Sparkles className="h-4 w-4" />
            Create Survey with AI
          </Link>
          <Link href="#templates" className="btn-secondary px-6 py-3 text-base">
            <PlayCircle className="h-4 w-4" />
            Explore Demo
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">No credit card required · 14-day free trial · Cancel anytime</p>
      </div>

      <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-gray-200 bg-white p-3 shadow-panel">
        <div className="flex items-center gap-1.5 border-b border-gray-100 px-3 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-4">
          {[
            { label: "Active Surveys", value: "8" },
            { label: "Total Responses", value: "583" },
            { label: "Completion Rate", value: "78%" },
            { label: "Team Members", value: "14" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-left">
              <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
      <ArrowRight className="hidden" aria-hidden />
    </section>
  );
}
