import { createClient } from "@supabase/supabase-js";

// Public project URL + anon (publishable) key. These are designed to be
// shipped in client code — every row is protected by Row Level Security.
// Env vars override them at build time if set.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://oxwqkyiabjlzgphykkyg.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_eVIq7_PS-q-yeIpOlOzopg_FYeuw0Jj";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
