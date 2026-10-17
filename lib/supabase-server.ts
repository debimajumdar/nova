import { createClient } from "@supabase/supabase-js";

// Server-only client with the secret key. Used for writes the browser must not be able to make
// (logging AI generations, recording clinician approvals). Never import this from a client component.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export function serverSupabase() {
  if (!url || !secretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY in .env.local (server-only; never prefix it with NEXT_PUBLIC_).");
  }
  return createClient(url, secretKey, { auth: { persistSession: false } });
}
