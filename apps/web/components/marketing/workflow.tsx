import { Sparkles, Share2, BarChart3, Brain } from "lucide-react";

const steps = [
  {
    step: "01",
    tag: "Create",
    title: "AI Survey Generator",
    description: "Describe what you need. AI builds the survey.",
    icon: Sparkles,
    color: "bg-violet-600",
  },
  {
    step: "02",
    tag: "Collect",
    title: "Multi-channel Distribution",
    description: "Share anywhere. Collect responses at scale.",
    icon: Share2,
    color: "bg-purple-600",
  },
  {
    step: "03",
    tag: "Analyze",
    title: "Real-time Analytics",
    description: "Live dashboards. Response trends. Demographics.",
    icon: BarChart3,
    color: "bg-blue-600",
  },
  {
    step: "04",
    tag: "Understand",
    title: "AI Intelligence",
    description: "Ask AI anything. Get actionable insights.",
    icon: Brain,
    color: "bg-emerald-600",
  },
];

export function Workflow() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-gray-900">One platform. Complete workflow.</h2>
        <p className="mt-3 text-gray-500">From idea to insight, everything you need to run professional surveys at scale.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ step, tag, title, description, icon: Icon, color }) => (
          <div key={step} className="card p-6">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="mt-4 inline-block text-xs font-semibold text-gray-400">{tag}</span>
            <h3 className="mt-1 text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
