import { createClient } from "@supabase/supabase-js";

// Vite env vars — set these in .env (see .env.example) and in your host (Vercel/Cloudflare).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
