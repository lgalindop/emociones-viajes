import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("SUPABASE URL =", import.meta.env.VITE_SUPABASE_URL);
console.log(
  "SUPABASE KEY =",
  import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 10)
);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
