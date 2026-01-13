import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://twtqwlxsojnzzsevywzw.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3dHF3bHhzb2puenpzZXZ5d3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTEwMzcsImV4cCI6MjA4Mzc4NzAzN30.ynO99XpK5efgGWk0Qy5igPvtCt8W6-8CeBGeYqhV9t0";

export const supabase = createClient(supabaseUrl, supabaseKey);
