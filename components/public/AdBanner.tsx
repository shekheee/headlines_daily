"use client";

import { useEffect } from "react";

interface Ad {
  id: string;
  type: "BANNER" | "ADSENSE";
  imageUrl: string | null;
  targetUrl: string | null;
  adSlotId: string | null;
  adClient: string | null;
}

function trackImpression(adId: string) {
  fetch(`/api/ads/${adId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "impression" }),
  }).catch(() => {});
}

function trackClick(adId: string) {
  fetch(`/api/ads/${adId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "click" }),
  }).catch(() => {});
}

export function AdBanner({ ad }: { ad: Ad }) {
  useEffect(() => {
    trackImpression(ad.id);
  }, [ad.id]);

  if (ad.type === "ADSENSE" && ad.adClient && ad.adSlotId) {
    return (
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ad.adClient}
        data-ad-slot={ad.adSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    );
  }

  if (ad.type === "BANNER" && ad.imageUrl) {
    return (
      <a
        href={ad.targetUrl || "#"}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => trackClick(ad.id)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.imageUrl} alt="Advertisement" className="w-full h-auto rounded" />
      </a>
    );
  }

  return null;
}
