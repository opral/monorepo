import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL as string,
  process.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string
);
