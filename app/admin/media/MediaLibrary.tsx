"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Copy, Check, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export function MediaLibrary({ initialMedia }: { initialMedia: any[] }) {
  const [media, setMedia] = useState(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", altText);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const item = await res.json();
        setMedia((prev) => [item, ...prev]);
      }
    }
    setUploading(false);
    setAltText("");
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Images"}
        </Button>
        <Input
          placeholder="Alt text for next upload..."
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          className="max-w-xs"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) upload(e.target.files); e.target.value = ""; }}
        />
        <span className="text-sm text-muted-foreground ml-auto">{media.length} images</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {media.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => setPreview(item)}
          >
            <img src={item.url} alt={item.altText || item.filename} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); copyUrl(item.url, item.id); }}
                className="bg-white text-black rounded-full p-1.5 hover:bg-gray-100"
                title="Copy URL"
              >
                {copied === item.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            No images uploaded yet. Upload some!
          </div>
        )}
      </div>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        {preview && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-mono truncate">{preview.filename}</DialogTitle>
            </DialogHeader>
            <img src={preview.url} alt={preview.altText || ""} className="w-full rounded-lg" />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-2 py-1 rounded text-xs truncate">{preview.url}</code>
                <Button size="sm" variant="outline" onClick={() => copyUrl(preview.url, preview.id)}>
                  {copied === preview.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={preview.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                {preview.width && <span>{preview.width} × {preview.height}px</span>}
                {preview.size && <span>{(preview.size / 1024).toFixed(1)} KB</span>}
                <span>{preview.format?.toUpperCase()}</span>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
