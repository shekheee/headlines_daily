"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Pencil, Trash2, BarChart2, Eye } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { formatDate } from "@/lib/utils";

const POSITIONS = [
  { value: "HEADER", label: "Header Banner" },
  { value: "FOOTER", label: "Footer Banner" },
  { value: "SIDEBAR_TOP", label: "Sidebar — Top" },
  { value: "SIDEBAR_BOTTOM", label: "Sidebar — Bottom" },
  { value: "ARTICLE_INLINE", label: "Article — Inline" },
  { value: "ARTICLE_BOTTOM", label: "Article — Bottom" },
  { value: "HOMEPAGE_BANNER", label: "Homepage Banner" },
];

function AdForm({ ad, onSubmit, onCancel }: any) {
  const [type, setType] = useState(ad?.type || "BANNER");
  const [title, setTitle] = useState(ad?.title || "");
  const [imageUrl, setImageUrl] = useState(ad?.imageUrl || "");
  const [adSlotId, setAdSlotId] = useState(ad?.adSlotId || "");
  const [adClient, setAdClient] = useState(ad?.adClient || "");
  const [targetUrl, setTargetUrl] = useState(ad?.targetUrl || "");
  const [position, setPosition] = useState(ad?.position || "");
  const [isActive, setIsActive] = useState(ad?.isActive ?? true);
  const [startDate, setStartDate] = useState(ad?.startDate ? new Date(ad.startDate).toISOString().slice(0, 16) : "");
  const [endDate, setEndDate] = useState(ad?.endDate ? new Date(ad.endDate).toISOString().slice(0, 16) : "");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!title || !position) return;
    setSaving(true);
    await onSubmit({
      title,
      type,
      imageUrl: type === "BANNER" ? imageUrl : null,
      adSlotId: type === "ADSENSE" ? adSlotId : null,
      adClient: type === "ADSENSE" ? adClient : null,
      targetUrl,
      position,
      isActive,
      startDate: startDate || null,
      endDate: endDate || null,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Tabs value={type} onValueChange={setType}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="BANNER">Banner Ad</TabsTrigger>
          <TabsTrigger value="ADSENSE">Google AdSense</TabsTrigger>
        </TabsList>

        <TabsContent value="BANNER" className="space-y-4 mt-4">
          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            label="Ad Image"
            folder="daily-news/ads"
          />
        </TabsContent>

        <TabsContent value="ADSENSE" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>AdSense Publisher ID (ca-pub-...)</Label>
            <Input value={adClient} onChange={(e) => setAdClient(e.target.value)} placeholder="ca-pub-0000000000000000" />
          </div>
          <div className="space-y-2">
            <Label>Ad Slot ID</Label>
            <Input value={adSlotId} onChange={(e) => setAdSlotId(e.target.value)} placeholder="1234567890" />
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-2">
        <Label>Ad Name *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Header Banner Q1 2026" />
      </div>

      {type === "BANNER" && (
        <div className="space-y-2">
          <Label>Click URL (optional)</Label>
          <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://..." />
        </div>
      )}

      <div className="space-y-2">
        <Label>Position *</Label>
        <Select value={position} onValueChange={setPosition}>
          <SelectTrigger>
            <SelectValue placeholder="Select placement..." />
          </SelectTrigger>
          <SelectContent>
            {POSITIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handle} disabled={saving || !title || !position}>
          {saving ? "Saving..." : "Save Ad"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function AdsManager({ ads }: { ads: any[] }) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const openNew = () => { setEditing(null); setShowDialog(true); };
  const openEdit = (ad: any) => { setEditing(ad); setShowDialog(true); };

  const handleSubmit = async (data: any) => {
    const url = editing ? `/api/ads/${editing.id}` : "/api/ads";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { setShowDialog(false); router.refresh(); }
  };

  const toggleActive = async (ad: any) => {
    await fetch(`/api/ads/${ad.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ad.isActive }),
    });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    await fetch(`/api/ads/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Ad
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Ad</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Type</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Position</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Stats</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ads.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No ads yet</td></tr>
            )}
            {ads.map((ad) => (
              <tr key={ad.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {ad.imageUrl && (
                      <img src={ad.imageUrl} alt={ad.title} className="w-12 h-8 object-cover rounded" />
                    )}
                    <div>
                      <p className="font-medium">{ad.title}</p>
                      {ad.endDate && (
                        <p className="text-xs text-muted-foreground">Ends {formatDate(ad.endDate)}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Badge variant={ad.type === "ADSENSE" ? "info" : "secondary"}>
                    {ad.type}
                  </Badge>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                  {POSITIONS.find((p) => p.value === ad.position)?.label || ad.position}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {ad.impressions}</span>
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={ad.isActive}
                    onCheckedChange={() => toggleActive(ad)}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(ad)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(ad.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Ad" : "New Ad"}</DialogTitle>
          </DialogHeader>
          <AdForm ad={editing} onSubmit={handleSubmit} onCancel={() => setShowDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
