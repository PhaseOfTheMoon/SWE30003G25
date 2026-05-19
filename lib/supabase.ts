import { createClient } from "@supabase/supabase-js";

// Get the Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create and export the Supabase client so other files can use it
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
