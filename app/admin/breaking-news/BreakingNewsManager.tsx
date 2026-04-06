"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2, Zap } from "lucide-react";
import { formatDate } from "@/lib/utils";

function BreakingNewsForm({ item, onSubmit, onCancel }: any) {
  const [text, setText] = useState(item?.text || "");
  const [url, setUrl] = useState(item?.url || "");
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [expiresAt, setExpiresAt] = useState(
    item?.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!text) return;
    setSaving(true);
    await onSubmit({ text, url: url || null, isActive, expiresAt: expiresAt || null });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Breaking News Text *</Label>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Breaking: Major earthquake hits..." />
      </div>
      <div className="space-y-2">
        <Label>Link URL (optional)</Label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <Label>Expires At (optional)</Label>
        <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Active (show on ticker)</Label>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handle} disabled={saving || !text}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function BreakingNewsManager({ items }: { items: any[] }) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const openNew = () => { setEditing(null); setShowDialog(true); };
  const openEdit = (item: any) => { setEditing(item); setShowDialog(true); };

  const handleSubmit = async (data: any) => {
    const url = editing ? `/api/breaking-news/${editing.id}` : "/api/breaking-news";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { setShowDialog(false); router.refresh(); }
  };

  const toggleActive = async (item: any) => {
    await fetch(`/api/breaking-news/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this breaking news item?")) return;
    await fetch(`/api/breaking-news/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const active = items.filter((i) => i.isActive);

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-red-600" />
          {active.length} item{active.length !== 1 ? "s" : ""} showing on ticker
        </div>
        <Button onClick={openNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Breaking News
        </Button>
      </div>

      {/* Live preview */}
      {active.length > 0 && (
        <div className="bg-red-600 text-white rounded-lg overflow-hidden">
          <div className="flex items-center gap-0">
            <div className="bg-red-800 text-white text-xs font-bold px-3 py-2 whitespace-nowrap">
              BREAKING
            </div>
            <div className="overflow-hidden flex-1">
              <div className="px-4 py-2 text-sm whitespace-nowrap animate-ticker-scroll inline-block">
                {active.map((i, idx) => (
                  <span key={i.id}>
                    {idx > 0 && <span className="mx-4">•</span>}
                    {i.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className={!item.isActive ? "opacity-60" : ""}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.text}</p>
                {item.url && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.url}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={item.isActive ? "success" : "secondary"}>
                    {item.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {item.expiresAt && (
                    <span className="text-xs text-muted-foreground">
                      Expires {formatDate(item.expiresAt)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch checked={item.isActive} onCheckedChange={() => toggleActive(item)} />
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No breaking news items yet.
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Breaking News" : "New Breaking News"}</DialogTitle>
          </DialogHeader>
          <BreakingNewsForm item={editing} onSubmit={handleSubmit} onCancel={() => setShowDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
