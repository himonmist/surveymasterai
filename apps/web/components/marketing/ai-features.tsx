import { FileText, ImageIcon, Wand2, MessageSquareText, GitBranch, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "Generate from a sentence",
    description: "Describe your survey in plain language and get a complete, editable questionnaire in seconds.",
  },
  {
    icon: FileText,
    title: "Generate from documents",
    description: "Upload a PDF, Word, or Excel questionnaire and let AI reconstruct it as an editable survey.",
  },
  {
    icon: ImageIcon,
    title: "Generate from screenshots",
    description: "Upload a screenshot of any form and AI converts it into native SurveyMasterAI questions.",
  },
  {
    icon: MessageSquareText,
    title: "AI builder copilot",
    description: '"Add 5 questions about customer service" — a conversational assistant that edits your survey live.',
  },
  {
    icon: GitBranch,
    title: "Smart branching logic",
    description: "Visual conditional logic, skip logic, and answer piping — no spreadsheets required.",
  },
  {
    icon: ShieldCheck,
    title: "AI quality checks",
    description: "Detects leading, ambiguous, and double-barrelled questions before you publish.",
  },
];

export function AiFeatures() {
  return (
    <section id="ai" className="bg-gray-900 px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">AI deeply integrated, end to end</h2>
          <p className="mt-3 text-gray-400">
            Not a bolt-on chatbot — AI is woven into creation, analysis, and reporting.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-6">
              <Icon className="h-6 w-6 text-brand-300" />
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-gray-400">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
