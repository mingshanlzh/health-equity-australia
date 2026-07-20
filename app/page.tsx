"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Globe2,
  MapPin,
  Newspaper,
  PenLine,
  Presentation,
  Scale,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { fmtDate, type Post, type Seminar } from "@/lib/types";
import { fetchAuthorsMap, authorName, type PublicAuthor } from "@/lib/authors";

const PILLARS = [
  {
    icon: Presentation,
    title: "Seminar series",
    text: "Regular online seminars featuring health equity researchers from across the region and around the world.",
    href: "/seminars/",
  },
  {
    icon: PenLine,
    title: "Member blog",
    text: "Members share perspectives, methods and commentary on equity-informative research and policy.",
    href: "/blog/",
  },
  {
    icon: Newspaper,
    title: "Research exchange",
    text: "A living library of member publications and projects — from DCEA to social determinants of health.",
    href: "/research/",
  },
  {
    icon: Users,
    title: "Global community",
    text: "Connect with researchers, practitioners and students who care about fair distribution of health.",
    href: "/members/",
  },
];

export default function HomePage() {
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, PublicAuthor>>({});
  const [stats, setStats] = useState({ members: 0, seminars: 0, posts: 0 });

  useEffect(() => {
    supabase
      .from("seminars")
      .select("*")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(3)
      .then(({ data }) => setSeminars((data as Seminar[]) ?? []));

    supabase
      .from("posts")
      .select("*")
      .eq("kind", "blog")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(async ({ data }) => {
        const p = (data as Post[]) ?? [];
        setPosts(p);
        setAuthors(await fetchAuthorsMap(p.map((x) => x.author_id)));
      });

    Promise.all([
      supabase.from("public_profiles").select("id", { count: "exact", head: true }),
      supabase.from("seminars").select("id", { count: "exact", head: true }),
      supabase.from("posts").select("id", { count: "exact", head: true }),
    ]).then(([m, s, p]) =>
      setStats({
        members: m.count ?? 0,
        seminars: s.count ?? 0,
        posts: p.count ?? 0,
      })
    );
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-30"
          style={{
            background:
              "radial-gradient(60rem 30rem at 85% -10%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 60%), radial-gradient(40rem 24rem at 0% 110%, color-mix(in oklch, var(--accent) 60%, transparent), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <Badge variant="outline" className="mb-5 gap-1.5 border-primary/30 bg-primary/5 px-3 py-1 text-primary">
            <Scale className="size-3.5" />
            Health Equity Special Interest Group
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl md:text-[3.4rem]">
            Advancing <span className="text-primary">health equity</span> research
            across Australasia
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            We bring together researchers, practitioners and students across
            Australia, Aotearoa New Zealand and the world to share research,
            host seminars, and build the evidence base for a fairer
            distribution of health.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/register/">
                Join the community <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/seminars/">Explore seminars</Link>
            </Button>
          </div>
          <div className="mt-12 grid max-w-lg grid-cols-3 gap-6">
            {[
              { n: stats.members, label: "Members" },
              { n: stats.seminars, label: "Seminars" },
              { n: stats.posts, label: "Posts" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-serif text-3xl font-bold text-primary">
                  {s.n > 0 ? s.n : "—"}
                </div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <Link key={p.title} href={p.href} className="group">
              <Card className="h-full transition-all group-hover:-translate-y-1 group-hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <p.icon className="size-5.5" />
                  </div>
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {p.text}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming seminars */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Upcoming seminars</h2>
              <p className="mt-2 text-muted-foreground">
                Free and open to everyone — join from anywhere.
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/seminars/">
                All seminars <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          {seminars.length === 0 ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
                <CalendarDays className="size-5" />
                No upcoming seminars scheduled yet — check back soon or browse
                past recordings on the seminars page.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {seminars.map((s) => (
                <Card key={s.id} className="flex flex-col">
                  <CardHeader>
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
                      <CalendarDays className="size-4" />
                      {fmtDate(s.starts_at, true)}
                    </div>
                    <CardTitle className="text-lg leading-snug">{s.title}</CardTitle>
                    <CardDescription>
                      {s.speaker}
                      {s.speaker_affiliation ? ` · ${s.speaker_affiliation}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-4" /> {s.location || "Online"}
                    </span>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/seminars/">Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Latest blog posts */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">From the blog</h2>
            <p className="mt-2 text-muted-foreground">
              Perspectives and commentary from our members.
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/blog/">
              All posts <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {posts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
              <PenLine className="size-5" />
              No posts yet — members can sign in and write the first one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/post/?id=${p.id}`} className="group">
                <Card className="h-full transition-all group-hover:-translate-y-1 group-hover:shadow-md">
                  <CardHeader>
                    <div className="mb-1 text-sm text-muted-foreground">
                      {fmtDate(p.created_at)} · {authorName(authors, p.author_id)}
                    </div>
                    <CardTitle className="text-lg leading-snug group-hover:text-primary">
                      {p.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 leading-relaxed">
                      {p.excerpt || p.content.slice(0, 180)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-bold sm:text-3xl">
              <Globe2 className="size-7" /> A global community, an Australasian home
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed opacity-90">
              Membership is free and open to anyone interested in health equity
              research — wherever you are in the world. Create a profile, share
              your work, and join the conversation.
            </p>
          </div>
          <Button size="lg" variant="secondary" asChild className="shrink-0">
            <Link href="/register/">
              Become a member <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
