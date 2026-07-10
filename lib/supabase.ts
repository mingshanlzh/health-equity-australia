import { createClient } from "@supabase/supabase-js";

// Public project URL + anon (publishable) key. These are designed to be shipped
// in client code — every row is protected by Row Level Security in Postgres.
// Env vars override them at build time if set.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://oxwqkyiabjlzgphykkyg.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94d3FreWlhYmpsemdwaHlra3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MzA5MTMsImV4cCI6MjA5OTIwNjkxM30.l1p_Mlvc9hZwjhbLyyb6TiYidelRCloBu_o81vqcOro";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
