import { MarketingNavbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { Workflow } from "@/components/marketing/workflow";
import { AiFeatures } from "@/components/marketing/ai-features";
import { TemplatesShowcase } from "@/components/marketing/templates";
import { Pricing } from "@/components/marketing/pricing";
import { Testimonials } from "@/components/marketing/testimonials";
import { Faq } from "@/components/marketing/faq";
import { FinalCta, Footer } from "@/components/marketing/cta-footer";

export default function LandingPage() {
  return (
    <main>
      <MarketingNavbar />
      <Hero />
      <Workflow />
      <AiFeatures />
      <TemplatesShowcase />
      <Pricing />
      <Testimonials />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
