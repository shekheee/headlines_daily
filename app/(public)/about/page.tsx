import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { SITE } from "@/lib/site";
import { Scale, Globe2, Zap, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: `About Us | ${SITE.name}`,
  description: `${SITE.name} is an independent India-focused news platform covering politics, business, sport and the stories that shape the nation.`,
  alternates: { canonical: `${SITE.url}/about` },
};

const VALUES = [
  {
    icon: Scale,
    title: "Independent",
    body: "We are not owned by any political party, corporate house or pressure group. Our only loyalty is to our readers.",
  },
  {
    icon: ShieldCheck,
    title: "Accurate",
    body: "Every story is checked against credible sources. When we get something wrong, we correct it openly and quickly.",
  },
  {
    icon: Globe2,
    title: "India-first",
    body: "From national politics to regional voices, we cover the issues that matter to Indians — with context, not just headlines.",
  },
  {
    icon: Zap,
    title: "Fast & clear",
    body: "We cut through the noise with concise, readable reporting you can trust, on the web and across social platforms.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[#f7f7f5]">
      <PageHero
        kicker="About Us"
        title={`Independent journalism for a changing India`}
        intro={`${SITE.name} is a digital news platform dedicated to covering India — its politics, economy, society and the moments that define the nation.`}
      />

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="prose prose-lg prose-slate max-w-none prose-headings:font-playfair prose-headings:text-gray-900 prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline">
          <h2>Our mission</h2>
          <p>
            India is one of the fastest-moving stories on earth. Every day brings new decisions in Parliament,
            shifts in the markets, movements on the ground and debates that shape hundreds of millions of lives.
            Our mission is simple: to help readers understand what is happening in India, and why it matters — clearly,
            fairly and without an agenda.
          </p>

          <h2>What we cover</h2>
          <p>
            {SITE.name} reports across Indian politics, business and the economy, world affairs seen through an Indian
            lens, sport, technology, and culture. Alongside the daily news, our <Link href="/">newsroom</Link> revisits
            the moments from India&apos;s past that still shape the present.
          </p>

          <h2>How we work</h2>
          <p>
            We monitor a wide range of credible sources, verify what we publish, and write it in plain language. We
            clearly separate reporting from analysis, avoid sensationalism, and update stories as they develop. We
            believe transparency builds trust, so if you ever spot an error, we want to hear about it — see our{" "}
            <Link href="/contact">contact page</Link>.
          </p>
        </div>

        {/* Values */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="border border-gray-200 bg-white p-6">
              <v.icon className="h-7 w-7 text-red-600" aria-hidden />
              <h3 className="mt-3 text-lg font-bold text-gray-900">{v.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-gray-600">{v.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-start gap-4 border-t-2 border-gray-900 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Have a story or a question?</h3>
            <p className="mt-1 text-gray-600">We&apos;d love to hear from readers, sources and partners.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/contact"
              className="bg-red-600 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-red-700"
            >
              Contact Us
            </Link>
            <Link
              href="/advertise"
              className="border border-gray-300 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900"
            >
              Advertise
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
