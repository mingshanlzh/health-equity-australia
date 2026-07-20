"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  HeartHandshake,
  Lightbulb,
  Mail,
  Send,
  Target,
  Users,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

const AIMS = [
  {
    icon: Lightbulb,
    title: "Advance methods",
    text: "Promote development and uptake of equity-informative methods — distributional cost-effectiveness analysis, equity-relevant evidence synthesis, and measurement of health inequalities.",
  },
  {
    icon: Users,
    title: "Build community",
    text: "Connect health equity researchers across career stages and disciplines, creating opportunities for collaboration, mentoring and peer support.",
  },
  {
    icon: BookOpenCheck,
    title: "Share knowledge",
    text: "Host a regular seminar series, share member research, and curate resources that make equity-focused research easier to find and use.",
  },
  {
    icon: Target,
    title: "Inform policy",
    text: "Support the translation of equity evidence into health policy and practice across Australasia's health systems.",
  },
];

export default function AboutPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from("contact_messages")
      .insert({ name, email, message });
    setSending(false);
    if (error) {
      toast.error("Could not send your message. Please try again.");
    } else {
      toast.success("Thanks — your message has been sent to the SIG convenors.");
      setName("");
      setEmail("");
      setMessage("");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">About the SIG</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Health Equity Australasia is the Health Equity Special Interest
          Group — a community of researchers, practitioners and students who
          share a commitment to understanding and reducing unfair differences
          in health. Our home is in Australia and Aotearoa New Zealand, and our
          doors are open to anyone in the world working on, or curious about,
          health equity research.
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Health equity research spans health economics, epidemiology, public
          health, health services research and the social sciences. It asks not
          only <em>whether</em> policies and interventions improve health, but{" "}
          <em>whose</em> health they improve — and whether they narrow or widen
          the gaps between groups. The SIG exists to strengthen this field:
          sharpening methods, connecting people, and bringing equity evidence
          closer to decision-making.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {AIMS.map((a) => (
          <Card key={a.title}>
            <CardHeader>
              <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <a.icon className="size-5.5" />
              </div>
              <CardTitle className="text-lg">{a.title}</CardTitle>
              <CardDescription className="leading-relaxed">{a.text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="mt-12 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <HeartHandshake className="mt-1 size-8 shrink-0 text-primary" />
            <div>
              <div className="font-serif text-xl font-bold">Get involved</div>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Membership is free. Members can create a profile in the
                directory, write blog posts, share their research, and post to
                the community noticeboard. We warmly welcome students and
                early-career researchers.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/register/">Join now</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Contact */}
      <div id="contact" className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Mail className="size-6 text-primary" /> Contact the convenors
          </h2>
          <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
            Questions about the SIG, ideas for seminars, or interest in
            presenting your work? Send us a message — we read everything and
            reply as soon as we can.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="c-name">Name</Label>
                  <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email">Email</Label>
                  <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu.au" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-msg">Message</Label>
                <Textarea id="c-msg" required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" />
              </div>
              <Button type="submit" disabled={sending}>
                <Send className="size-4" /> {sending ? "Sending…" : "Send message"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
