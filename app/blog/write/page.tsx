"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, PenLine, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Markdown from "@/components/Markdown";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { Post, PostKind } from "@/lib/types";

function WriteForm() {
  const { session, profile, isMember, isAdmin, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [kind, setKind] = useState<PostKind>(
    params.get("kind") === "notice" ? "notice" : "blog"
  );
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!editId);

  useEffect(() => {
    if (!editId) return;
    supabase
      .from("posts")
      .select("*")
      .eq("id", editId)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as Post | null;
        if (p) {
          setTitle(p.title);
          setContent(p.content);
          setExcerpt(p.excerpt ?? "");
          setTags(p.tags.join(", "));
          setKind(p.kind);
        }
        setLoaded(true);
      });
  }, [editId]);

  if (loading) return null;

  if (!session || !profile) {
    return (
      <Gate
        title="Sign in to write"
        text="You need to be signed in as an approved member to write posts."
        cta={<Button asChild><Link href="/login/">Sign in</Link></Button>}
      />
    );
  }
  if (!isMember) {
    return (
      <Gate
        title="Membership pending"
        text="Your account is awaiting approval by a SIG convenor. Once approved, you'll be able to write blog posts and noticeboard items."
      />
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    const payload = {
      title: title.trim(),
      content,
      excerpt: excerpt.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      kind,
      published: true,
      updated_at: new Date().toISOString(),
    };
    let error, newId;
    if (editId) {
      ({ error } = await supabase.from("posts").update(payload).eq("id", editId));
      newId = editId;
    } else {
      const res = await supabase
        .from("posts")
        .insert({ ...payload, author_id: session!.user.id })
        .select("id")
        .single();
      error = res.error;
      newId = res.data?.id;
    }
    setSaving(false);
    if (error) {
      toast.error(`Could not save: ${error.message}`);
    } else {
      toast.success(editId ? "Post updated" : "Post published");
      router.push(kind === "notice" ? "/noticeboard/" : `/blog/post/?id=${newId}`);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="flex items-center gap-2.5 text-3xl font-bold">
        <PenLine className="size-7 text-primary" />
        {editId ? "Edit post" : "Write a post"}
      </h1>
      <p className="mt-3 text-muted-foreground">
        Posts support{" "}
        <a
          href="https://www.markdownguide.org/basic-syntax/"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          Markdown
        </a>{" "}
        — headings, links, lists, tables, code and images.
      </p>

      {loaded && (
        <form onSubmit={save} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A clear, engaging title" />
            </div>
            <div className="space-y-2">
              <Label>Post to</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as PostKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="notice">Noticeboard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Summary (shown in listings)</Label>
            <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="One or two sentences" />
          </div>
          <div className="space-y-2">
            <Label>Content * (Markdown)</Label>
            <Tabs defaultValue="write">
              <TabsList>
                <TabsTrigger value="write"><PenLine className="size-3.5" /> Write</TabsTrigger>
                <TabsTrigger value="preview"><Eye className="size-3.5" /> Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea
                  required
                  rows={16}
                  className="font-mono text-sm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={"## Heading\n\nYour text here…"}
                />
              </TabsContent>
              <TabsContent value="preview">
                <Card>
                  <CardContent className="min-h-90 py-4">
                    {content ? <Markdown>{content}</Markdown> : (
                      <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="DCEA, policy, conference report" />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving || !title.trim() || !content.trim()}>
              <Save className="size-4" /> {saving ? "Saving…" : editId ? "Save changes" : "Publish"}
            </Button>
            {isAdmin && kind === "notice" && (
              <p className="self-center text-xs text-muted-foreground">Noticeboard items appear immediately.</p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Gate({ title, text, cta }: { title: string; text: string; cta?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">{text}</p>
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense>
      <WriteForm />
    </Suspense>
  );
}
