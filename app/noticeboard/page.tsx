"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { fmtDate, type Post } from "@/lib/types";
import { fetchAuthorsMap, authorName, type PublicAuthor } from "@/lib/authors";

export default function NoticeboardPage() {
  const { isMember } = useAuth();
  const [notices, setNotices] = useState<Post[] | null>(null);
  const [authors, setAuthors] = useState<Record<string, PublicAuthor>>({});

  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .eq("kind", "notice")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        const p = (data as Post[]) ?? [];
        setNotices(p);
        setAuthors(await fetchAuthorsMap(p.map((x) => x.author_id)));
      });
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-bold sm:text-4xl">
            <Megaphone className="size-8 text-primary" /> Noticeboard
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Community announcements — job openings, PhD opportunities, calls
            for papers, conferences and collaboration requests.
          </p>
        </div>
        {isMember && (
          <Button asChild>
            <Link href="/blog/write/?kind=notice">
              <Plus className="size-4" /> Post a notice
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-10 space-y-4">
        {notices === null ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : notices.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription className="py-6 text-center">
                No notices yet — members can post announcements here.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          notices.map((n) => (
            <Link key={n.id} href={`/blog/post/?id=${n.id}`} className="group block">
              <Card className="transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{fmtDate(n.created_at)}</span>
                    <span>·</span>
                    <span>{authorName(authors, n.author_id)}</span>
                    {n.tags.map((t) => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                  <CardTitle className="text-lg leading-snug group-hover:text-primary">
                    {n.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 leading-relaxed">
                    {n.excerpt || n.content.slice(0, 200)}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
