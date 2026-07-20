"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Markdown from "@/components/Markdown";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { fmtDate, type Comment, type Post } from "@/lib/types";
import {
  fetchAuthorsMap,
  authorName,
  initials,
  type PublicAuthor,
} from "@/lib/authors";

function PostView() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const { session, isMember, isAdmin } = useAuth();

  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [authors, setAuthors] = useState<Record<string, PublicAuthor>>({});
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setPost(null);
      return;
    }
    const { data: p } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    setPost((p as Post) ?? null);
    if (p) {
      const { data: c } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", id)
        .order("created_at", { ascending: true });
      const cs = (c as Comment[]) ?? [];
      setComments(cs);
      setAuthors(
        await fetchAuthorsMap([
          (p as Post).author_id,
          ...cs.map((x) => x.author_id),
        ])
      );
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !session || !id) return;
    setSending(true);
    const { error } = await supabase.from("comments").insert({
      post_id: id,
      author_id: session.user.id,
      content: newComment.trim(),
    });
    setSending(false);
    if (error) toast.error(error.message);
    else {
      setNewComment("");
      load();
    }
  }

  async function deleteComment(c: Comment) {
    const { error } = await supabase.from("comments").delete().eq("id", c.id);
    if (error) toast.error(error.message);
    else load();
  }

  async function deletePost() {
    if (!post) return;
    if (!confirm(`Delete post "${post.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Post deleted");
      router.push(post.kind === "notice" ? "/noticeboard/" : "/blog/");
    }
  }

  if (post === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-14">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (post === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">
        Post not found.{" "}
        <Link href="/blog/" className="text-primary hover:underline">
          Back to the blog
        </Link>
      </div>
    );
  }

  const a = authors[post.author_id];
  const canEdit = session && (session.user.id === post.author_id || isAdmin);
  const backHref = post.kind === "notice" ? "/noticeboard/" : "/blog/";

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {post.kind === "notice" ? "noticeboard" : "blog"}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>
        {canEdit && (
          <div className="flex shrink-0 gap-1.5">
            <Button size="icon" variant="outline" className="size-9" asChild aria-label="Edit post">
              <Link href={`/blog/write/?id=${post.id}`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button size="icon" variant="outline" className="size-9 text-destructive" onClick={deletePost} aria-label="Delete post">
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Avatar className="size-10 border">
          <AvatarImage src={a?.avatar_url ?? undefined} alt="" />
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials(a?.display_name)}
          </AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <div className="font-medium">{authorName(authors, post.author_id)}</div>
          <div className="text-muted-foreground">
            {fmtDate(post.created_at)}
            {a?.affiliation ? ` · ${a.affiliation}` : ""}
          </div>
        </div>
      </div>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
        </div>
      )}

      <Separator className="my-8" />
      <Markdown>{post.content}</Markdown>
      <Separator className="my-10" />

      {/* Comments */}
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <MessageSquare className="size-5 text-primary" />
        Discussion ({comments.length})
      </h2>
      <div className="mt-6 space-y-4">
        {comments.map((c) => {
          const ca = authors[c.author_id];
          const canDelete = session && (session.user.id === c.author_id || isAdmin);
          return (
            <Card key={c.id}>
              <CardContent className="flex gap-3 py-4">
                <Avatar className="size-8 border">
                  <AvatarImage src={ca?.avatar_url ?? undefined} alt="" />
                  <AvatarFallback className="bg-primary/10 text-[0.65rem] font-semibold text-primary">
                    {initials(ca?.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{authorName(authors, c.author_id)}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {fmtDate(c.created_at)}
                      {canDelete && (
                        <button
                          onClick={() => deleteComment(c)}
                          className="text-destructive hover:opacity-70"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{c.content}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {isMember ? (
          <form onSubmit={addComment} className="space-y-3">
            <Textarea
              rows={3}
              placeholder="Join the discussion…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={sending || !newComment.trim()}>
              <Send className="size-4" /> {sending ? "Posting…" : "Post comment"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link href="/login/" className="text-primary hover:underline">Sign in</Link>{" "}
            as a member to join the discussion.
          </p>
        )}
      </div>
    </div>
  );
}

export default function PostPage() {
  return (
    <Suspense>
      <PostView />
    </Suspense>
  );
}
