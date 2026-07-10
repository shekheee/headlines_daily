import { APP_NAME, APP_URL } from "@/lib/seo";

// Central place for company / contact details shown on the static pages.
// Anything sensitive or account-specific can be overridden via env.
export const SITE = {
  name: APP_NAME,
  url: APP_URL || "https://lokmandate.com",
  domain: (APP_URL || "https://lokmandate.com").replace(/^https?:\/\//, "").replace(/\/$/, ""),
  tagline: "Independent · India · News",
  description:
    "Independent India news — politics, business and the stories that shape the nation.",
  location: "India",
  // Contact addresses (override via env if you use different inboxes).
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@lokmandate.com",
  editorialEmail: process.env.NEXT_PUBLIC_EDITORIAL_EMAIL || "editor@lokmandate.com",
  adsEmail: process.env.NEXT_PUBLIC_ADS_EMAIL || "advertise@lokmandate.com",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/lokmandate/",
} as const;
