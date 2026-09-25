import Link from "next/link";

const links = [
  { href: "#features", label: "Product" },
  { href: "#templates", label: "Templates" },
  { href: "#ai", label: "AI Features" },
  { href: "#pricing", label: "Pricing" },
];

export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
            S
          </span>
          SurveyMasterAI
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-gray-900">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">
            Log in
          </Link>
          <Link href="/register" className="btn-primary">
            Start Free
          </Link>
        </div>
      </div>
    </header>
  );
}
