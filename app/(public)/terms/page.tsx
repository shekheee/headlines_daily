import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms of Use | ${SITE.name}`,
  description: `The terms and conditions governing your use of ${SITE.name}.`,
  alternates: { canonical: `${SITE.url}/terms` },
};

const LAST_UPDATED = "10 July 2026";

export default function TermsPage() {
  return (
    <div className="bg-[#f7f7f5]">
      <PageHero kicker="Legal" title="Terms of Use" intro={`Last updated: ${LAST_UPDATED}`} />

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="prose prose-lg prose-slate max-w-none prose-headings:font-playfair prose-headings:text-gray-900 prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline">
          <p>
            These Terms of Use (&quot;Terms&quot;) govern your access to and use of {SITE.domain} (the &quot;Site&quot;),
            operated by {SITE.name}. By accessing or using the Site, you agree to be bound by these Terms. If you do not
            agree, please do not use the Site.
          </p>

          <h2>Use of the Site</h2>
          <p>
            You may use the Site for lawful, personal, non-commercial purposes. You agree not to misuse the Site,
            including by attempting to gain unauthorised access, disrupting its operation, scraping content at scale, or
            using it to distribute unlawful, harmful or misleading material.
          </p>

          <h2>Intellectual property</h2>
          <p>
            All content on the Site — including articles, images, graphics, logos and the {SITE.name} name — is owned by
            us or our licensors and is protected by copyright and other laws. You may share links to our articles and
            quote short extracts with attribution, but you may not republish, reproduce or redistribute our content in
            full without prior written permission.
          </p>

          <h2>Editorial content &amp; accuracy</h2>
          <p>
            We work to ensure our reporting is accurate and up to date, but the Site is provided for general information
            only and does not constitute professional, legal, financial or other advice. News develops quickly; we may
            update, correct or remove content at any time. If you believe something is inaccurate, please tell us via our{" "}
            <Link href="/contact">contact page</Link>.
          </p>

          <h2>Third-party links &amp; advertising</h2>
          <p>
            The Site may contain links to third-party websites and display advertising. We are not responsible for the
            content, products or practices of any third party, and a link or advertisement does not imply endorsement.
            Your dealings with third parties are solely between you and them.
          </p>

          <h2>User submissions</h2>
          <p>
            If you send us tips, feedback or other materials, you grant us a non-exclusive, royalty-free right to use
            them in connection with our reporting and operations. Please do not send confidential information you do not
            wish us to use.
          </p>

          <h2>Disclaimer of warranties</h2>
          <p>
            The Site is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, whether
            express or implied, including fitness for a particular purpose, accuracy or uninterrupted availability.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, {SITE.name} shall not be liable for any indirect, incidental or
            consequential damages arising from your use of, or inability to use, the Site or any content on it.
          </p>

          <h2>Changes to these Terms</h2>
          <p>
            We may revise these Terms from time to time. Continued use of the Site after changes take effect constitutes
            acceptance of the updated Terms. The &quot;Last updated&quot; date above shows when they were last revised.
          </p>

          <h2>Governing law</h2>
          <p>
            These Terms are governed by the laws of India, and any disputes shall be subject to the exclusive
            jurisdiction of the courts of India.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these Terms? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or visit our{" "}
            <Link href="/contact">contact page</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
