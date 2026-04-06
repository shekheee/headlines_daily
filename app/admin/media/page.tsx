import { prisma } from "@/lib/prisma";
import { MediaLibrary } from "./MediaLibrary";

export const metadata = { title: "Media Library — Headlines Daily Admin" };

export default async function MediaPage() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 48,
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Media Library</h1>
        <p className="text-muted-foreground mt-1">Images and assets uploaded to Cloudinary</p>
      </div>
      <MediaLibrary initialMedia={media} />
    </div>
  );
}
