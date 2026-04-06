import { prisma } from "@/lib/prisma";
import { AdBanner } from "./AdBanner";

// Using string type until prisma generate has run
type AdPosition = string;

interface AdSlotProps {
  position: AdPosition;
  className?: string;
}

export async function AdSlot({ position, className }: AdSlotProps) {
  const now = new Date();
  let ad = null;
  try {
    ad = await prisma.ad.findFirst({
      where: {
        position: position as any,
        isActive: true,
        OR: [{ endDate: null }, { endDate: { gt: now } }],
        AND: [{ OR: [{ startDate: null }, { startDate: { lte: now } }] }],
      },
    });
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
