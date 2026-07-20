"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name.trim() } },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <CheckCircle2 className="mb-4 size-14 text-primary" />
        <h1 className="text-2xl font-bold">Almost there!</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click
          it to verify your email, then sign in. A SIG convenor will approve
          your membership shortly after — you&apos;ll then be able to create
          your profile, write posts and share research.
        </p>
        <Button asChild className="mt-6">
          <Link href="/login/">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20">
      <div className="mb-6 text-primary">
        <Logo size={48} />
      </div>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join the community</CardTitle>
          <CardDescription>
            Free membership, open to anyone interested in health equity
            research — anywhere in the world.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu.au"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              <UserPlus className="size-4" /> {busy ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
            New accounts are reviewed by a SIG convenor before full membership
            is activated. Already have an account?{" "}
            <Link href="/login/" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
