import { prisma } from "@/lib/prisma";
import { AdsManager } from "./AdsManager";

export const metadata = { title: "Ads — Headlines Daily Admin" };

export default async function AdsPage() {
  const ads = await prisma.ad.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ad Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage banner ads and Google AdSense placements
        </p>
      </div>
      <AdsManager ads={ads} />
    </div>
  );
}
