"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

const PRESET_COLORS = [
  "#DC2626", "#EA580C", "#D97706", "#CA8A04",
  "#65A30D", "#16A34A", "#0891B2", "#2563EB",
  "#7C3AED", "#9333EA", "#C026D3", "#E11D48",
  "#0F172A", "#374151", "#6B7280",
];

function CategoryForm({ category, allCategories, onSubmit, onCancel }: any) {
  const [name, setName] = useState(category?.name || "");
  const [color, setColor] = useState(category?.color || "#2563EB");
  const [description, setDescription] = useState(category?.description || "");
  const [parentId, setParentId] = useState(category?.parentId || "none");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!name) return;
    setSaving(true);
    await onSubmit({ name, color, description, parentId: parentId && parentId !== "none" ? parentId : null });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. World News" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." />
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "#000" : "transparent",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-12 rounded cursor-pointer border"
          />
          <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono uppercase w-28" />
          <div className="w-9 h-9 rounded-md border" style={{ backgroundColor: color }} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Parent Category</Label>
        <Select value={parentId} onValueChange={setParentId}>
          <SelectTrigger>
            <SelectValue placeholder="Top-level category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (top-level)</SelectItem>
            {allCategories
              .filter((c: any) => c.id !== category?.id)
              .map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handle} disabled={saving || !name}>
          {saving ? "Saving..." : "Save Category"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function CategoriesManager({ categories }: { categories: any[] }) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const openNew = () => { setEditing(null); setShowDialog(true); };
  const openEdit = (c: any) => { setEditing(c); setShowDialog(true); };

  const handleSubmit = async (data: any) => {
    const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowDialog(false);
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Articles will become uncategorized.")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="overflow-hidden">
            <div className="h-2" style={{ backgroundColor: cat.color }} />
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{cat.name}</h3>
                  {cat.parent && (
                    <p className="text-xs text-muted-foreground">under {cat.parent.name}</p>
                  )}
                  {cat.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {cat._count.articles} article{cat._count.articles !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(cat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No categories yet. Create your first one!
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editing}
            allCategories={categories}
            onSubmit={handleSubmit}
            onCancel={() => setShowDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
