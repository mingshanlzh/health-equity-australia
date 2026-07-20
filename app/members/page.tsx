"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Globe,
  Linkedin,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { initials } from "@/lib/authors";

interface DirectoryProfile {
  id: string;
  display_name: string | null;
  affiliation: string | null;
  position: string | null;
  country: string | null;
  bio: string | null;
  research_interests: string[];
  website: string | null;
  orcid: string | null;
  twitter: string | null;
  linkedin: string | null;
  avatar_url: string | null;
}

export default function MembersPage() {
  const [members, setMembers] = useState<DirectoryProfile[] | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DirectoryProfile | null>(null);

  useEffect(() => {
    supabase
      .from("public_profiles")
      .select("*")
      .order("display_name", { ascending: true })
      .then(({ data }) => setMembers((data as DirectoryProfile[]) ?? []));
  }, []);

  const q = query.toLowerCase();
  const filtered = (members ?? []).filter(
    (m) =>
      !q ||
      (m.display_name ?? "").toLowerCase().includes(q) ||
      (m.affiliation ?? "").toLowerCase().includes(q) ||
      (m.country ?? "").toLowerCase().includes(q) ||
      m.research_interests.some((i) => i.toLowerCase().includes(q))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-bold sm:text-4xl">
            <Users className="size-8 text-primary" /> Member directory
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Meet the researchers, practitioners and students in our community.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/register/">Join the directory</Link>
        </Button>
      </div>

      <div className="relative mt-8 w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search name, affiliation, interests…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {members === null ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
        ) : filtered.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardDescription className="py-6 text-center">
                {members.length === 0
                  ? "The directory is just getting started — be the first to join!"
                  : "No members match your search."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          filtered.map((m) => (
            <button key={m.id} onClick={() => setSelected(m)} className="text-left">
              <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-14 border">
                      <AvatarImage src={m.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {initials(m.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {m.display_name || "SIG member"}
                      </CardTitle>
                      <CardDescription className="truncate">
                        {[m.position, m.affiliation].filter(Boolean).join(", ")}
                      </CardDescription>
                      {m.country && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" /> {m.country}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {m.research_interests.length > 0 && (
                  <CardContent className="flex flex-wrap gap-1.5">
                    {m.research_interests.slice(0, 4).map((i) => (
                      <Badge key={i} variant="secondary" className="font-normal">
                        {i}
                      </Badge>
                    ))}
                    {m.research_interests.length > 4 && (
                      <Badge variant="outline" className="font-normal">
                        +{m.research_interests.length - 4}
                      </Badge>
                    )}
                  </CardContent>
                )}
              </Card>
            </button>
          ))
        )}
      </div>

      {/* Profile dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="size-16 border">
                    <AvatarImage src={selected.avatar_url ?? undefined} alt="" />
                    <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                      {initials(selected.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">
                      {selected.display_name || "SIG member"}
                    </DialogTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[selected.position, selected.affiliation, selected.country]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
              </DialogHeader>
              {selected.bio && (
                <p className="whitespace-pre-line text-sm leading-relaxed">{selected.bio}</p>
              )}
              {selected.research_interests.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-semibold">Research interests</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.research_interests.map((i) => (
                      <Badge key={i} variant="secondary" className="font-normal">{i}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {selected.website && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={selected.website} target="_blank" rel="noreferrer">
                      <Globe className="size-4" /> Website
                    </a>
                  </Button>
                )}
                {selected.orcid && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`https://orcid.org/${selected.orcid.replace(/^https?:\/\/orcid\.org\//, "")}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" /> ORCID
                    </a>
                  </Button>
                )}
                {selected.linkedin && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={selected.linkedin} target="_blank" rel="noreferrer">
                      <Linkedin className="size-4" /> LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
