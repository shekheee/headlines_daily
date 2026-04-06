"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Save, Send, Eye, X, Plus } from "lucide-react";
import slugify from "slugify";

// Dynamically import TipTap to avoid SSR issues
const ArticleEditor = dynamic(
  () => import("@/components/admin/ArticleEditor").then((m) => m.ArticleEditor),
  { ssr: false, loading: () => <div className="border rounded-lg h-64 animate-pulse bg-muted" /> }
);

interface ArticleFormProps {
  article?: any;
  categories: any[];
  tags: any[];
}

export function ArticleForm({ article, categories, tags: allTags }: ArticleFormProps) {
  const router = useRouter();
  const isEdit = !!article;

  const [title, setTitle] = useState(article?.title || "");
  const [content, setContent] = useState(article?.content || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [featuredImage, setFeaturedImage] = useState(article?.featuredImage || "");
  const [featuredImageAlt, setFeaturedImageAlt] = useState(article?.featuredImageAlt || "");
  const [categoryId, setCategoryId] = useState(article?.categoryId || "none");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    article?.tags?.map((t: any) => t.id) || []
  );
  const [isFeatured, setIsFeatured] = useState(article?.isFeatured || false);
  const [metaTitle, setMetaTitle] = useState(article?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(article?.metaDescription || "");
  const [publishedAt, setPublishedAt] = useState(
    article?.publishedAt ? new Date(article.publishedAt).toISOString().slice(0, 16) : ""
  );
  const [newTag, setNewTag] = useState("");
  const [localTags, setLocalTags] = useState(allTags);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const save = async (status: "DRAFT" | "PUBLISHED") => {
    if (!title) { setSaveError("Title is required"); return; }
    if (!content) { setSaveError("Content is required"); return; }

    setSaving(true);
    setSaveError("");

    const payload = {
      title,
      content,
      excerpt,
      featuredImage,
      featuredImageAlt,
      status,
      publishedAt: publishedAt || null,
      isFeatured,
      categoryId: categoryId && categoryId !== "none" ? categoryId : null,
      tagIds: selectedTags,
      metaTitle,
      metaDescription,
    };

    const url = isEdit ? `/api/articles/${article.id}` : "/api/articles";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/articles/${data.id}`);
      router.refresh();
    } else {
      const err = await res.json();
      setSaveError(err.error || "Failed to save");
    }
  };

  const addTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const tag = await res.json();
      setLocalTags((prev) => [...prev, tag]);
      setSelectedTags((prev) => [...prev, tag.id]);
      setNewTag("");
    }
  };

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main editor column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Article headline..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold"
          />
          {title && (
            <p className="text-xs text-muted-foreground">
              Slug: <code>{slugify(title, { lower: true, strict: true })}</code>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            placeholder="Brief summary shown in article previews..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Content *</Label>
          <ArticleEditor content={content} onChange={setContent} />
        </div>
      </div>

      {/* Sidebar column */}
      <div className="space-y-4">
        {/* Publish actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}

            <div className="space-y-2">
              <Label htmlFor="publishedAt">Scheduled date (optional)</Label>
              <Input
                id="publishedAt"
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="featured">Featured article</Label>
              <Switch
                id="featured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => save("DRAFT")}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button onClick={() => save("PUBLISHED")} disabled={saving}>
                <Send className="mr-2 h-4 w-4" />
                Publish
              </Button>
            </div>

            {isEdit && article.status === "PUBLISHED" && (
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <a href={`/articles/${article.slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-4 w-4" />
                  View live article
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Featured image */}
        <Card>
          <CardContent className="pt-4">
            <ImageUploader
              value={featuredImage}
              onChange={setFeaturedImage}
              folder="daily-news/featured"
            />
            {featuredImage && (
              <div className="mt-2 space-y-1">
                <Label htmlFor="imgAlt" className="text-xs">Alt text</Label>
                <Input
                  id="imgAlt"
                  placeholder="Describe the image..."
                  value={featuredImageAlt}
                  onChange={(e) => setFeaturedImageAlt(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {localTags.map((tag: any) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    selectedTags.includes(tag.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-muted-foreground/30 hover:border-primary"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="New tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="h-8 text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="metaTitle" className="text-xs">Meta title</Label>
              <Input
                id="metaTitle"
                placeholder={title}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="h-8 text-xs"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">{metaTitle.length}/60</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="metaDesc" className="text-xs">Meta description</Label>
              <Textarea
                id="metaDesc"
                placeholder={excerpt}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                className="text-xs"
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">{metaDescription.length}/160</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
