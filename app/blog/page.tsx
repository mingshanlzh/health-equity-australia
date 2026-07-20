"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PenLine, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { fmtDate, type Post } from "@/lib/types";
import {
  fetchAuthorsMap,
  authorName,
  initials,
  type PublicAuthor,
} from "@/lib/authors";

export default function BlogPage() {
  const { isMember } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [authors, setAuthors] = useState<Record<string, PublicAuthor>>({});
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .eq("kind", "blog")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        const p = (data as Post[]) ?? [];
        setPosts(p);
        setAuthors(await fetchAuthorsMap(p.map((x) => x.author_id)));
      });
  }, []);

  const allTags = [...new Set((posts ?? []).flatMap((p) => p.tags))].sort();
  const filtered = (posts ?? []).filter((p) => {
    const q = query.toLowerCase();
    const matchesQ =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.excerpt ?? "").toLowerCase().includes(q) ||
      authorName(authors, p.author_id).toLowerCase().includes(q);
    const matchesTag = !tag || p.tags.includes(tag);
    return matchesQ && matchesTag;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Blog</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Perspectives, methods and commentary from the health equity
            community.
          </p>
        </div>
        {isMember && (
          <Button asChild>
            <Link href="/blog/write/">
              <PenLine className="size-4" /> Write a post
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search posts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((t) => (
              <button key={t} onClick={() => setTag(tag === t ? null : t)}>
                <Badge variant={tag === t ? "default" : "secondary"} className="cursor-pointer">
                  {t}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 space-y-5">
        {posts === null ? (
          <>
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </>
        ) : filtered.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription className="py-6 text-center">
                {posts.length === 0
                  ? "No posts yet — members can sign in and write the first one."
                  : "No posts match your search."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          filtered.map((p) => {
            const a = authors[p.author_id];
            return (
              <Link key={p.id} href={`/blog/post/?id=${p.id}`} className="group block">
                <Card className="transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border">
                        <AvatarImage src={a?.avatar_url ?? undefined} alt="" />
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {initials(a?.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-medium">{authorName(authors, p.author_id)}</div>
                        <div className="text-muted-foreground">
                          {fmtDate(p.created_at)}
                          {a?.affiliation ? ` · ${a.affiliation}` : ""}
                        </div>
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-xl leading-snug group-hover:text-primary">
                      {p.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 leading-relaxed">
                      {p.excerpt || p.content.slice(0, 220)}
                    </CardDescription>
                    {p.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.tags.map((t) => (
                          <Badge key={t} variant="secondary">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
