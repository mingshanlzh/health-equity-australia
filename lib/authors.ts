import { supabase } from "@/lib/supabase";

export interface PublicAuthor {
  id: string;
  display_name: string | null;
  affiliation: string | null;
  position: string | null;
  avatar_url: string | null;
}

/** Fetch safe public author info for a set of profile ids (via the
 *  public_profiles view). Authors hidden from the directory resolve to null
 *  and are shown as "SIG member". */
export async function fetchAuthorsMap(
  ids: (string | null | undefined)[]
): Promise<Record<string, PublicAuthor>> {
  const unique = [...new Set(ids.filter(Boolean) as string[])];
  if (unique.length === 0) return {};
  const { data } = await supabase
    .from("public_profiles")
    .select("id, display_name, affiliation, position, avatar_url")
    .in("id", unique);
  const map: Record<string, PublicAuthor> = {};
  (data ?? []).forEach((a) => (map[a.id] = a as PublicAuthor));
  return map;
}

export function authorName(
  map: Record<string, PublicAuthor>,
  id: string | null | undefined
): string {
  if (!id) return "SIG member";
  return map[id]?.display_name || "SIG member";
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
