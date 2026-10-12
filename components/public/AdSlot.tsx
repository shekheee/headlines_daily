import { prisma } from "@/lib/prisma";
import { AdBanner } from "./AdBanner";
import { unstable_cache } from "next/cache";
import type { AdPosition } from "@/generated/prisma/enums";

interface AdSlotProps {
  position: AdPosition;
  className?: string;
}

const getActiveAd = unstable_cache(
  async (position: AdPosition) => {
    const now = new Date();
    return prisma.ad.findFirst({
      where: {
        position,
        isActive: true,
        OR: [{ endDate: null }, { endDate: { gt: now } }],
        AND: [{ OR: [{ startDate: null }, { startDate: { lte: now } }] }],
      },
    });
  },
  ["active-ad"],
  { revalidate: 21600, tags: ["ads"] }
);

export async function AdSlot({ position, className }: AdSlotProps) {
  let ad = null;
  try {
    ad = await getActiveAd(position);
  } catch {
    return null;
  }

  if (!ad) return null;

  return (
    <div className={className}>
      <AdBanner
        ad={{
          id: ad.id,
          type: ad.type as "BANNER" | "ADSENSE",
          imageUrl: ad.imageUrl,
          targetUrl: ad.targetUrl,
          adSlotId: ad.adSlotId,
          adClient: ad.adClient,
        }}
      />
    </div>
  );
}
