export type Role = "admin" | "member" | "pending" | "rejected";

export interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  role: Role;
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
  show_in_directory: boolean;
  created_at: string;
}

export interface Seminar {
  id: string;
  title: string;
  speaker: string | null;
  speaker_affiliation: string | null;
  abstract: string | null;
  starts_at: string | null;
  location: string | null;
  join_url: string | null;
  recording_url: string | null;
  slides_url: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
}

export type PostKind = "blog" | "notice";

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  kind: PostKind;
  tags: string[];
  published: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, "display_name" | "affiliation" | "avatar_url"> | null;
}

export interface ResearchItem {
  id: string;
  title: string;
  authors: string | null;
  venue: string | null; // journal / conference / working paper series
  year: number | null;
  link: string | null;
  doi: string | null;
  summary: string | null;
  tags: string[];
  author_id: string;
  created_at: string;
  author?: Pick<Profile, "display_name" | "affiliation" | "avatar_url"> | null;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Pick<Profile, "display_name" | "avatar_url"> | null;
}

export function fmtDate(d: string | null | undefined, withTime = false): string {
  if (!d) return "TBA";
  const date = new Date(d);
  const opts: Intl.DateTimeFormatOptions = withTime
    ? { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" };
  return date.toLocaleString("en-AU", opts);
}
