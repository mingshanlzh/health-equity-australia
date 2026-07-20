"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Save, UserRound } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/authors";
import { fmtDate, type Post } from "@/lib/types";

export default function AccountPage() {
  const { session, profile, loading, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    display_name: "",
    affiliation: "",
    position: "",
    country: "",
    bio: "",
    research_interests: "",
    website: "",
    orcid: "",
    twitter: "",
    linkedin: "",
    show_in_directory: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (profile && !hydrated) {
      setForm({
        display_name: profile.display_name ?? "",
        affiliation: profile.affiliation ?? "",
        position: profile.position ?? "",
        country: profile.country ?? "",
        bio: profile.bio ?? "",
        research_interests: profile.research_interests.join(", "),
        website: profile.website ?? "",
        orcid: profile.orcid ?? "",
        twitter: profile.twitter ?? "",
        linkedin: profile.linkedin ?? "",
        show_in_directory: profile.show_in_directory,
      });
      setHydrated(true);
    }
  }, [profile, hydrated]);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("posts")
      .select("*")
      .eq("author_id", session.user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMyPosts((data as Post[]) ?? []));
  }, [session]);

  if (loading) return null;
  if (!session || !profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Sign in required</h1>
        <p className="mt-3 text-muted-foreground">
          Sign in to view and edit your profile.
        </p>
        <Button asChild className="mt-6">
          <Link href="/login/">Sign in</Link>
        </Button>
      </div>
    );
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name.trim() || null,
        affiliation: form.affiliation.trim() || null,
        position: form.position.trim() || null,
        country: form.country.trim() || null,
        bio: form.bio.trim() || null,
        research_interests: form.research_interests
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        website: form.website.trim() || null,
        orcid: form.orcid.trim() || null,
        twitter: form.twitter.trim() || null,
        linkedin: form.linkedin.trim() || null,
        show_in_directory: form.show_in_directory,
      })
      .eq("id", session!.user.id);
    setSaving(false);
    if (error) toast.error(`Could not save: ${error.message}`);
    else {
      toast.success("Profile saved");
      refreshProfile();
    }
  }

  async function uploadAvatar(file: File) {
    if (!session) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Please choose an image under 2 MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      toast.error(`Upload failed: ${upErr.message}`);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", session.user.id);
    setUploading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Photo updated");
      refreshProfile();
    }
  }

  const pending = profile.role === "pending";

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="flex items-center gap-2.5 text-3xl font-bold">
        <UserRound className="size-7 text-primary" /> My profile
      </h1>

      {pending && (
        <Card className="mt-6 border-amber-300/60 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/30">
          <CardContent className="py-4 text-sm leading-relaxed">
            <strong>Membership pending.</strong> A SIG convenor will review
            your account soon. You can complete your profile now; posting and
            the member directory unlock once you&apos;re approved.
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="size-20 border">
                <AvatarImage src={profile.avatar_url ?? undefined} alt="" />
                <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                  {initials(profile.display_name)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted"
                aria-label="Change photo"
              >
                <Camera className="size-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAvatar(f);
                }}
              />
            </div>
            <div>
              <CardTitle className="text-xl">
                {profile.display_name || "Unnamed member"}
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                {profile.email}
                <Badge variant={pending ? "secondary" : "default"} className="capitalize">
                  {profile.role}
                </Badge>
              </CardDescription>
              {uploading && (
                <p className="mt-1 text-xs text-muted-foreground">Uploading photo…</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Display name</Label>
                <Input value={form.display_name} onChange={(e) => set("display_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="PhD Candidate / Senior Lecturer…" />
              </div>
              <div className="space-y-2">
                <Label>Affiliation</Label>
                <Input value={form.affiliation} onChange={(e) => set("affiliation", e.target.value)} placeholder="Macquarie University" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Australia" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Short bio</Label>
              <Textarea rows={4} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A few sentences about you and your work…" />
            </div>
            <div className="space-y-2">
              <Label>Research interests (comma-separated)</Label>
              <Input
                value={form.research_interests}
                onChange={(e) => set("research_interests", e.target.value)}
                placeholder="Distributional CEA, Indigenous health, health financing"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Website</Label>
                <Input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-2">
                <Label>ORCID</Label>
                <Input value={form.orcid} onChange={(e) => set("orcid", e.target.value)} placeholder="0000-0000-0000-0000" />
              </div>
              <div className="space-y-2">
                <Label>X / Twitter URL</Label>
                <Input value={form.twitter} onChange={(e) => set("twitter", e.target.value)} placeholder="https://x.com/…" />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/…" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <div className="text-sm font-medium">Show me in the member directory</div>
                <div className="text-xs text-muted-foreground">
                  Your name, affiliation, bio and links will be publicly visible.
                </div>
              </div>
              <Switch
                checked={form.show_in_directory}
                onCheckedChange={(v) => set("show_in_directory", v)}
              />
            </div>
            <Button type="submit" disabled={saving}>
              <Save className="size-4" /> {saving ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {myPosts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold">My posts</h2>
          <div className="mt-4 space-y-3">
            {myPosts.map((p) => (
              <Link key={p.id} href={`/blog/post/?id=${p.id}`} className="block">
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between gap-3 py-3.5 text-sm">
                    <span className="min-w-0 truncate font-medium">{p.title}</span>
                    <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                      <Badge variant="secondary" className="capitalize">{p.kind}</Badge>
                      {fmtDate(p.created_at)}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
