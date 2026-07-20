"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(
        error.message === "Email not confirmed"
          ? "Please confirm your email first — check your inbox for the confirmation link."
          : error.message
      );
    } else {
      toast.success("Welcome back!");
      router.push("/");
    }
  }

  async function resetPassword() {
    if (!email) {
      toast.error("Enter your email above first, then click reset.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent — check your inbox.");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20">
      <div className="mb-6 text-primary">
        <Logo size={48} />
      </div>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Welcome back to Health Equity Australasia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              <LogIn className="size-4" /> {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm">
            <button onClick={resetPassword} className="text-muted-foreground hover:text-foreground">
              Forgot password?
            </button>
            <Link href="/register/" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
