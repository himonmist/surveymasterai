import Link from "next/link";

export function FinalCta() {
  return (
    <section className="bg-brand-700 px-6 py-16 text-center text-white">
      <h2 className="text-3xl font-bold">Ready to create smarter surveys?</h2>
      <p className="mx-auto mt-3 max-w-xl text-brand-100">
        Join teams using AI to design, publish, and understand every survey — in minutes, not weeks.
      </p>
      <Link href="/register" className="btn-primary mt-8 inline-flex bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50">
        Start Free
      </Link>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-12 text-sm text-gray-500">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <p className="flex items-center gap-2 text-base font-bold text-gray-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
              S
            </span>
            SurveyMasterAI
          </p>
          <p className="mt-3 text-xs text-gray-400">Create Smarter Surveys. Discover Better Insights.</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900">Product</p>
          <ul className="mt-3 space-y-2">
            <li><a href="#features">Features</a></li>
            <li><a href="#templates">Templates</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gray-900">Company</p>
          <ul className="mt-3 space-y-2">
            <li><a href="#">About</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gray-900">Legal</p>
          <ul className="mt-3 space-y-2">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-7xl border-t border-gray-100 pt-6 text-xs text-gray-400">
        © {new Date().getFullYear()} SurveyMasterAI. All rights reserved.
      </p>
    </footer>
  );
}
