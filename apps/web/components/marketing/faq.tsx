const faqs = [
  {
    q: "Do I need an AI provider API key to use SurveyMasterAI?",
    a: "No. SurveyMasterAI ships with a built-in deterministic AI provider so survey generation, quality checks, and analysis work out of the box. Connect OpenAI or Anthropic later for more advanced generation.",
  },
  {
    q: "Can I bring my own payment provider?",
    a: "Yes. Billing is built on a provider abstraction layer. It ships with a development provider (subscriptions activate immediately) and a Stripe integration you can enable with an API key.",
  },
  {
    q: "Is my organization's data isolated from other organizations?",
    a: "Yes. SurveyMasterAI is multi-tenant by design — every query is scoped to your organization, enforced at the application layer.",
  },
  {
    q: "Can respondents complete surveys anonymously?",
    a: "Yes. Survey creators can enable anonymous responses per survey, and access can be restricted to specific users, your organization, or the public.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold text-gray-900">Frequently asked questions</h2>
      <div className="mt-10 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
        {faqs.map((item) => (
          <details key={item.q} className="group p-6">
            <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 marker:content-none">
              {item.q}
            </summary>
            <p className="mt-3 text-sm text-gray-500">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
