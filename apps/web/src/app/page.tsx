import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { LiveDemo } from "@/components/site/LiveDemo";
import { Features } from "@/components/site/Features";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Trust } from "@/components/site/Trust";
import { Faq, FAQS } from "@/components/site/Faq";
import { EarlyAccess } from "@/components/site/EarlyAccess";
import { Footer } from "@/components/site/Footer";
import { SectionLinks } from "@/components/site/SectionLinks";
import { MobileCta } from "@/components/site/MobileCta";
import { SITE } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      email: SITE.email,
      slogan: SITE.tagline,
      logo: `${SITE.url}/apple-icon.png`,
      contactPoint: { "@type": "ContactPoint", email: SITE.email, contactType: "sales" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      publisher: { "@id": `${SITE.url}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      publisher: { "@id": `${SITE.url}/#organization` },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ],
};

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SectionLinks />
      <Navbar />
      <main>
        <Hero />
        <LiveDemo />
        <Features />
        <HowItWorks />
        <Trust />
        <Faq />
        <EarlyAccess />
      </main>
      <Footer />
      <MobileCta />
    </div>
  );
}
