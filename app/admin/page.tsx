"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Inbox,
  Mail,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/authors";
import { fmtDate, type Profile } from "@/lib/types";

interface ContactMessage {
  id: string;
  name: string | null;
  email: string | null;
  message: string;
  created_at: string;
}

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const load = useCallback(() => {
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setProfiles((data as Profile[]) ?? []));
    supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setMessages((data as ContactMessage[]) ?? []));
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (loading) return null;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Admins only</h1>
        <p className="mt-3 text-muted-foreground">
          This page is restricted to SIG convenors.
        </p>
      </div>
    );
  }

  async function setRole(p: Profile, role: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${p.display_name || p.email} → ${role}`);
      load();
    }
  }

  async function deleteMessage(m: ContactMessage) {
    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", m.id);
    if (error) toast.error(error.message);
    else load();
  }

  const pending = profiles.filter((p) => p.role === "pending");
  const members = profiles.filter((p) => p.role === "member" || p.role === "admin");
  const rejected = profiles.filter((p) => p.role === "rejected");

  function Row({ p, actions }: { p: Profile; actions: React.ReactNode }) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10 border">
              <AvatarImage src={p.avatar_url ?? undefined} alt="" />
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials(p.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium">
                <span className="truncate">{p.display_name || "Unnamed"}</span>
                <Badge variant={p.role === "admin" ? "default" : "secondary"} className="capitalize">
                  {p.role}
                </Badge>
              </div>
              <div className="truncate text-sm text-muted-foreground">
                {p.email} · joined {fmtDate(p.created_at)}
                {p.affiliation ? ` · ${p.affiliation}` : ""}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">{actions}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="flex items-center gap-2.5 text-3xl font-bold">
        <ShieldCheck className="size-8 text-primary" /> Admin panel
      </h1>
      <p className="mt-3 text-muted-foreground">
        Approve new members, manage roles, and read contact messages.
      </p>

      <Tabs defaultValue="pending" className="mt-8">
        <TabsList>
          <TabsTrigger value="pending">
            Pending{pending.length > 0 ? ` (${pending.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          <TabsTrigger value="messages">
            <Mail className="size-3.5" /> Messages ({messages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-3">
          {pending.length === 0 ? (
            <EmptyState icon={CheckCircle2} text="No pending applications — all caught up." />
          ) : (
            pending.map((p) => (
              <Row
                key={p.id}
                p={p}
                actions={
                  <>
                    <Button size="sm" onClick={() => setRole(p, "member")}>
                      <UserCheck className="size-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRole(p, "rejected")}>
                      <UserX className="size-4" /> Reject
                    </Button>
                  </>
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-6 space-y-3">
          {members.map((p) => (
            <Row
              key={p.id}
              p={p}
              actions={
                p.role === "member" ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setRole(p, "admin")}>
                      Make admin
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRole(p, "rejected")}>
                      Revoke
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setRole(p, "member")}>
                    Demote to member
                  </Button>
                )
              }
            />
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6 space-y-3">
          {rejected.length === 0 ? (
            <EmptyState icon={Inbox} text="No rejected accounts." />
          ) : (
            rejected.map((p) => (
              <Row
                key={p.id}
                p={p}
                actions={
                  <Button size="sm" variant="outline" onClick={() => setRole(p, "member")}>
                    <UserCheck className="size-4" /> Restore
                  </Button>
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-6 space-y-3">
          {messages.length === 0 ? (
            <EmptyState icon={Inbox} text="No contact messages yet." />
          ) : (
            messages.map((m) => (
              <Card key={m.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {m.name || "Anonymous"}{" "}
                      {m.email && (
                        <a href={`mailto:${m.email}`} className="text-sm font-normal text-primary hover:underline">
                          {m.email}
                        </a>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {fmtDate(m.created_at, true)}
                      <button onClick={() => deleteMessage(m)} className="text-destructive hover:opacity-70" aria-label="Delete message">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{m.message}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center justify-center gap-2 py-8">
          <Icon className="size-5" /> {text}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
