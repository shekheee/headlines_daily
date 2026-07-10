import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { ContactForm } from "@/components/public/ContactForm";
import { SITE } from "@/lib/site";
import { Mail, Pencil, Megaphone, AtSign } from "lucide-react";

export const metadata: Metadata = {
  title: `Contact | ${SITE.name}`,
  description: `Get in touch with the ${SITE.name} team — news tips, corrections, advertising and general enquiries.`,
  alternates: { canonical: `${SITE.url}/contact` },
};

const CHANNELS = [
  { icon: Mail, label: "General enquiries", value: SITE.email, href: `mailto:${SITE.email}` },
  { icon: Pencil, label: "Editorial & news tips", value: SITE.editorialEmail, href: `mailto:${SITE.editorialEmail}` },
  { icon: Megaphone, label: "Advertising & partnerships", value: SITE.adsEmail, href: `mailto:${SITE.adsEmail}` },
  { icon: AtSign, label: "Instagram", value: "@lokmandate", href: SITE.instagram },
];

export default function ContactPage() {
  return (
    <div className="bg-[#f7f7f5]">
      <PageHero
        kicker="Contact"
        title="Get in touch"
        intro="Whether you have a news tip, a correction, an advertising enquiry or just some feedback, we'd love to hear from you."
      />

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Form */}
          <div className="md:col-span-3">
            <h2 className="mb-5 text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              Send us a message
            </h2>
            <ContactForm toEmail={SITE.email} adsEmail={SITE.adsEmail} />
          </div>

          {/* Direct channels */}
          <div className="md:col-span-2">
            <h2 className="mb-5 text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              Reach us directly
            </h2>
            <ul className="space-y-4">
              {CHANNELS.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-start gap-3 border border-gray-200 bg-white p-4 transition-colors hover:border-red-500"
                  >
                    <c.icon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
                    <span>
                      <span className="block text-[11px] font-bold uppercase tracking-widest text-gray-500">
                        {c.label}
                      </span>
                      <span className="mt-0.5 block text-[15px] font-semibold text-gray-900 break-words">
                        {c.value}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-gray-500">
              We read every message and aim to respond within two working days. For corrections, please include a link
              to the article and the specific detail you believe is inaccurate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
