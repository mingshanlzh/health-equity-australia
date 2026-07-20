"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Video,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { fmtDate, type Seminar } from "@/lib/types";

const EMPTY = {
  title: "",
  speaker: "",
  speaker_affiliation: "",
  abstract: "",
  starts_at: "",
  location: "Online (Zoom)",
  join_url: "",
  recording_url: "",
  slides_url: "",
  tags: "",
};

type FormState = typeof EMPTY;

function toForm(s: Seminar): FormState {
  return {
    title: s.title,
    speaker: s.speaker ?? "",
    speaker_affiliation: s.speaker_affiliation ?? "",
    abstract: s.abstract ?? "",
    starts_at: s.starts_at ? new Date(s.starts_at).toISOString().slice(0, 16) : "",
    location: s.location ?? "",
    join_url: s.join_url ?? "",
    recording_url: s.recording_url ?? "",
    slides_url: s.slides_url ?? "",
    tags: s.tags.join(", "),
  };
}

function SeminarCard({
  s,
  isAdmin,
  onEdit,
  onDelete,
  past,
}: {
  s: Seminar;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  past?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const abstract = s.abstract ?? "";
  return (
    <Card className="group relative">
      {isAdmin && (
        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button size="icon" variant="outline" className="size-8" onClick={onEdit} aria-label="Edit seminar">
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon" variant="outline" className="size-8 text-destructive" onClick={onDelete} aria-label="Delete seminar">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
      <CardHeader>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-primary">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" /> {fmtDate(s.starts_at, true)}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4" /> {s.location || "Online"}
          </span>
        </div>
        <CardTitle className="pr-16 text-xl leading-snug">{s.title}</CardTitle>
        {(s.speaker || s.speaker_affiliation) && (
          <CardDescription className="text-[0.95rem]">
            {s.speaker}
            {s.speaker_affiliation ? ` — ${s.speaker_affiliation}` : ""}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {abstract && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {expanded || abstract.length <= 300 ? abstract : abstract.slice(0, 300) + "…"}
            {abstract.length > 300 && (
              <button
                className="ml-1 font-medium text-primary hover:underline"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </p>
        )}
        {s.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {s.tags.map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {!past && s.join_url && (
            <Button size="sm" asChild>
              <a href={s.join_url} target="_blank" rel="noreferrer">
                <Video className="size-4" /> Join seminar
              </a>
            </Button>
          )}
          {s.recording_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={s.recording_url} target="_blank" rel="noreferrer">
                <Video className="size-4" /> Recording
              </a>
            </Button>
          )}
          {s.slides_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={s.slides_url} target="_blank" rel="noreferrer">
                <FileText className="size-4" /> Slides
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SeminarsPage() {
  const { isAdmin, session } = useAuth();
  const [seminars, setSeminars] = useState<Seminar[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Seminar | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    supabase
      .from("seminars")
      .select("*")
      .order("starts_at", { ascending: false })
      .then(({ data }) => setSeminars((data as Seminar[]) ?? []));
  }, []);

  useEffect(load, [load]);

  const now = Date.now();
  const upcoming = (seminars ?? [])
    .filter((s) => s.starts_at && new Date(s.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime());
  const past = (seminars ?? []).filter(
    (s) => !s.starts_at || new Date(s.starts_at).getTime() < now
  );

  function set(k: keyof FormState, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  }

  function openEdit(s: Seminar) {
    setEditing(s);
    setForm(toForm(s));
    setDialogOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      speaker: form.speaker.trim() || null,
      speaker_affiliation: form.speaker_affiliation.trim() || null,
      abstract: form.abstract.trim() || null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      location: form.location.trim() || null,
      join_url: form.join_url.trim() || null,
      recording_url: form.recording_url.trim() || null,
      slides_url: form.slides_url.trim() || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      ...(editing ? {} : { created_by: session?.user?.id ?? null }),
    };
    const q = editing
      ? supabase.from("seminars").update(payload).eq("id", editing.id)
      : supabase.from("seminars").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) {
      toast.error(`Could not save seminar: ${error.message}`);
    } else {
      toast.success(editing ? "Seminar updated" : "Seminar added");
      setDialogOpen(false);
      load();
    }
  }

  async function remove(s: Seminar) {
    if (!confirm(`Delete seminar "${s.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("seminars").delete().eq("id", s.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Seminar deleted");
      load();
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Seminar series</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Our online seminars are free and open to all. Recordings and slides
            are shared here after each session, wherever speakers permit.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="size-4" /> Add seminar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit seminar" : "Add seminar"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={save} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input required value={form.title} onChange={(e) => set("title", e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Speaker</Label>
                    <Input value={form.speaker} onChange={(e) => set("speaker", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Affiliation</Label>
                    <Input value={form.speaker_affiliation} onChange={(e) => set("speaker_affiliation", e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date &amp; time</Label>
                    <Input type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Abstract</Label>
                  <Textarea rows={5} value={form.abstract} onChange={(e) => set("abstract", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Join link (Zoom/Teams)</Label>
                  <Input type="url" value={form.join_url} onChange={(e) => set("join_url", e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Recording URL</Label>
                    <Input type="url" value={form.recording_url} onChange={(e) => set("recording_url", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Slides URL</Label>
                    <Input type="url" value={form.slides_url} onChange={(e) => set("slides_url", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="DCEA, Indigenous health, methods" />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Saving…" : editing ? "Save changes" : "Add seminar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="mt-10">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-6 space-y-5">
          {seminars === null ? (
            <Skeleton className="h-40 w-full" />
          ) : upcoming.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No upcoming seminars scheduled yet — check back soon.
              </CardContent>
            </Card>
          ) : (
            upcoming.map((s) => (
              <SeminarCard key={s.id} s={s} isAdmin={isAdmin} onEdit={() => openEdit(s)} onDelete={() => remove(s)} />
            ))
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-6 space-y-5">
          {seminars === null ? (
            <Skeleton className="h-40 w-full" />
          ) : past.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Past seminars will appear here.
              </CardContent>
            </Card>
          ) : (
            past.map((s) => (
              <SeminarCard key={s.id} s={s} past isAdmin={isAdmin} onEdit={() => openEdit(s)} onDelete={() => remove(s)} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
        <ExternalLink className="size-4" />
        Want to present your work?{" "}
        <Link href="/about/#contact" className="text-primary hover:underline">
          Get in touch with the convenors.
        </Link>
      </p>
    </div>
  );
}
