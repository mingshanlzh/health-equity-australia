"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookMarked,
  ExternalLink,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { ResearchItem } from "@/lib/types";
import { fetchAuthorsMap, authorName, type PublicAuthor } from "@/lib/authors";

const EMPTY = {
  title: "",
  authors: "",
  venue: "",
  year: "",
  link: "",
  doi: "",
  summary: "",
  tags: "",
};

export default function ResearchPage() {
  const { session, isMember, isAdmin } = useAuth();
  const [items, setItems] = useState<ResearchItem[] | null>(null);
  const [authorsMap, setAuthorsMap] = useState<Record<string, PublicAuthor>>({});
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    supabase
      .from("research_items")
      .select("*")
      .order("year", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        const r = (data as ResearchItem[]) ?? [];
        setItems(r);
        setAuthorsMap(await fetchAuthorsMap(r.map((x) => x.author_id)));
      });
  }, []);

  useEffect(load, [load]);

  function set(k: keyof typeof EMPTY, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    const { error } = await supabase.from("research_items").insert({
      title: form.title.trim(),
      authors: form.authors.trim() || null,
      venue: form.venue.trim() || null,
      year: form.year ? parseInt(form.year, 10) : null,
      link: form.link.trim() || null,
      doi: form.doi.trim() || null,
      summary: form.summary.trim() || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      author_id: session.user.id,
    });
    setSaving(false);
    if (error) toast.error(`Could not share: ${error.message}`);
    else {
      toast.success("Research shared — thank you!");
      setForm(EMPTY);
      setDialogOpen(false);
      load();
    }
  }

  async function remove(r: ResearchItem) {
    if (!confirm(`Remove "${r.title}"?`)) return;
    const { error } = await supabase.from("research_items").delete().eq("id", r.id);
    if (error) toast.error(error.message);
    else load();
  }

  const q = query.toLowerCase();
  const filtered = (items ?? []).filter(
    (r) =>
      !q ||
      r.title.toLowerCase().includes(q) ||
      (r.authors ?? "").toLowerCase().includes(q) ||
      (r.venue ?? "").toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q))
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-bold sm:text-4xl">
            <BookMarked className="size-8 text-primary" /> Member research
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Publications, working papers and projects shared by our members — a
            living library of health equity research.
          </p>
        </div>
        {isMember && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Share research
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Share your research</DialogTitle>
              </DialogHeader>
              <form onSubmit={save} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input required value={form.title} onChange={(e) => set("title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Authors</Label>
                  <Input value={form.authors} onChange={(e) => set("authors", e.target.value)} placeholder="Jiang S, Smith A, et al." />
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
                  <div className="space-y-2">
                    <Label>Journal / venue</Label>
                    <Input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Health Economics" />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input type="number" min="1900" max="2100" value={form.year} onChange={(e) => set("year", e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Link</Label>
                    <Input type="url" value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="https://doi.org/…" />
                  </div>
                  <div className="space-y-2">
                    <Label>DOI</Label>
                    <Input value={form.doi} onChange={(e) => set("doi", e.target.value)} placeholder="10.1002/hec.xxxx" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Why it matters (short summary)</Label>
                  <Textarea rows={3} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="DCEA, Indigenous health, HTA" />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Sharing…" : "Share"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative mt-8 w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search title, author, journal, tag…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="mt-8 space-y-4">
        {items === null ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : filtered.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription className="py-6 text-center">
                {items.length === 0
                  ? "Nothing here yet — members can share their first paper."
                  : "No items match your search."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          filtered.map((r) => {
            const canDelete = session && (session.user.id === r.author_id || isAdmin);
            return (
              <Card key={r.id} className="group relative">
                {canDelete && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute right-3 top-3 size-8 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => remove(r)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
                <CardHeader>
                  <div className="text-sm text-muted-foreground">
                    {r.venue}
                    {r.year ? ` · ${r.year}` : ""}
                    {" · shared by "}
                    {authorName(authorsMap, r.author_id)}
                  </div>
                  <CardTitle className="pr-10 text-lg leading-snug">
                    {r.link ? (
                      <a href={r.link} target="_blank" rel="noreferrer" className="hover:text-primary">
                        {r.title}
                      </a>
                    ) : (
                      r.title
                    )}
                  </CardTitle>
                  {r.authors && (
                    <CardDescription>{r.authors}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {r.summary && (
                    <p className="text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {r.tags.map((t) => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                    {r.link && (
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Read <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
