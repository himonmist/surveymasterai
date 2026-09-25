const testimonials = [
  {
    quote:
      "We generated our entire customer satisfaction program in an afternoon. The AI-suggested questions were genuinely better than what our team had drafted.",
    name: "Elena Rodriguez",
    role: "VP of Customer Experience, Northwind Retail",
  },
  {
    quote:
      "The branching logic builder and analytics dashboards replaced three separate tools we were paying for.",
    name: "David Okafor",
    role: "Head of People Ops, Fenwick Labs",
  },
  {
    quote:
      "Ask AI About My Survey turned a week of manual analysis into a five-minute conversation.",
    name: "Mei Lin",
    role: "Research Director, Horizon Health",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-gray-900">Trusted by teams who take data seriously</h2>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.name} className="card p-6">
            <blockquote className="text-sm text-gray-600">&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption className="mt-4 text-sm font-semibold text-gray-900">
              {t.name}
              <span className="block text-xs font-normal text-gray-400">{t.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
