import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { SITE } from "@/lib/site";
import { LayoutTemplate, Newspaper, Film, Tag, Check } from "lucide-react";

export const metadata: Metadata = {
  title: `Advertise | ${SITE.name}`,
  description: `Reach an engaged, India-focused audience with ${SITE.name} — display, sponsored content, and Instagram reels & stories.`,
  alternates: { canonical: `${SITE.url}/advertise` },
};

const FORMATS = [
  {
    icon: LayoutTemplate,
    title: "Display advertising",
    body: "Premium banner placements across the homepage, article pages and sidebar — visible to every reader, on every device.",
  },
  {
    icon: Newspaper,
    title: "Sponsored content",
    body: "Tell your story in long form. Clearly-labelled branded articles crafted to sit naturally alongside our editorial.",
  },
  {
    icon: Film,
    title: "Instagram reels & stories",
    body: "Tap into our fast-growing social channels with sponsored reels, stories and shout-outs to a young Indian audience.",
  },
  {
    icon: Tag,
    title: "Category sponsorship",
    body: "Own a section — Politics, Business, Sport and more — with exclusive branding and first-position placements.",
  },
];

const WHY = [
  "An engaged, India-first readership across politics, business and culture",
  "Growing presence on Instagram with daily reels, stories and carousels",
  "Brand-safe, independent editorial environment",
  "Flexible packages for startups, agencies and established brands",
];

export default function AdvertisePage() {
  return (
    <div className="bg-[#f7f7f5]">
      <PageHero
        kicker="Advertise"
        title="Put your brand in front of India"
        intro={`Partner with ${SITE.name} to reach readers who care about what's happening across the country — on the web and on social.`}
      />

      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Why advertise */}
        <div className="border border-gray-200 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Why advertise with us
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {WHY.map((w) => (
              <li key={w} className="flex items-start gap-2.5 text-[15px] text-gray-700">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Formats */}
        <h2 className="mt-12 mb-5 text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
          Ways to work with us
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {FORMATS.map((f) => (
            <div key={f.title} className="border border-gray-200 bg-white p-6">
              <f.icon className="h-7 w-7 text-red-600" aria-hidden />
              <h3 className="mt-3 text-lg font-bold text-gray-900">{f.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-gray-600">{f.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 border-t-2 border-gray-900 bg-white p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Let&apos;s talk
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-gray-600">
            Request our media kit and rate card, or tell us about your campaign and we&apos;ll put together a package
            that fits.
          </p>
          <a
            href={`mailto:${SITE.adsEmail}?subject=${encodeURIComponent("Advertising enquiry")}`}
            className="mt-6 inline-block bg-red-600 px-7 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-red-700"
          >
            Request media kit
          </a>
          <p className="mt-4 text-sm text-gray-500">
            Or email us directly at{" "}
            <a href={`mailto:${SITE.adsEmail}`} className="font-semibold text-red-600 hover:underline">
              {SITE.adsEmail}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
