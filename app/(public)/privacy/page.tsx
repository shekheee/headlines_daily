import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE.name}`,
  description: `How ${SITE.name} collects, uses and protects your information.`,
  alternates: { canonical: `${SITE.url}/privacy` },
};

const LAST_UPDATED = "10 July 2026";

export default function PrivacyPage() {
  return (
    <div className="bg-[#f7f7f5]">
      <PageHero kicker="Legal" title="Privacy Policy" intro={`Last updated: ${LAST_UPDATED}`} />

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="prose prose-lg prose-slate max-w-none prose-headings:font-playfair prose-headings:text-gray-900 prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline">
          <p>
            This Privacy Policy explains how {SITE.name} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects,
            uses and safeguards information when you visit {SITE.domain} (the &quot;Site&quot;). By using the Site, you
            agree to the practices described here.
          </p>

          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Information you give us.</strong> When you contact us (for example via our{" "}
              <Link href="/contact">contact page</Link>) you may share your name, email address and the contents of your
              message. Because our contact form opens your own email application, your message is sent directly to us by
              email.
            </li>
            <li>
              <strong>Usage &amp; device data.</strong> Like most websites, our servers and service providers may
              automatically record technical information such as your browser type, device, referring pages and
              approximate location derived from your IP address.
            </li>
            <li>
              <strong>Visitor counts.</strong> We keep aggregate counts of total page views and unique visitors. To
              recognise returning browsers we store a single, anonymous first-party cookie
              (<code>lm_vid</code>) that contains a random identifier — it is not linked to your name or email.
            </li>
          </ul>

          <h2>Cookies</h2>
          <p>
            We use cookies and similar technologies to operate the Site, remember preferences (such as language),
            measure visits, and — where applicable — serve advertising. You can control or delete cookies through your
            browser settings; disabling them may affect some features.
          </p>

          <h2>Advertising</h2>
          <p>
            We may display advertising, including from third-party ad networks. These partners may use cookies or
            similar technologies to show more relevant ads and measure performance. Their use of your information is
            governed by their own privacy policies.
          </p>

          <h2>Third-party services</h2>
          <p>
            We rely on trusted third parties to run the Site — for example content delivery and image hosting, and
            social platforms such as Instagram where we publish content. These providers process data on our behalf or
            under their own policies.
          </p>

          <h2>How we use information</h2>
          <p>
            We use the information we collect to operate and improve the Site, respond to your enquiries, understand how
            our content performs, keep the Site secure, and comply with legal obligations. We do not sell your personal
            information.
          </p>

          <h2>Data retention &amp; security</h2>
          <p>
            We retain information only for as long as necessary for the purposes described above, and we take reasonable
            technical and organisational measures to protect it. No method of transmission over the internet is fully
            secure, so we cannot guarantee absolute security.
          </p>

          <h2>Your rights</h2>
          <p>
            Depending on where you live, you may have rights to access, correct or delete your personal information, or
            to object to certain processing. To make a request, email us at{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </p>

          <h2>Children</h2>
          <p>
            The Site is intended for a general audience and is not directed at children under 13. We do not knowingly
            collect personal information from children.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the &quot;Last updated&quot;
            date above. Significant changes will be highlighted on the Site.
          </p>

          <h2>Contact us</h2>
          <p>
            Questions about this policy? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or visit our{" "}
            <Link href="/contact">contact page</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
