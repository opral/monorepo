import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://localhost:8000";
const supabaseAnonKey =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoyNTUwNjUzNjM0LCJyb2xlIjoiYW5vbiJ9.36fUebxgx1mcBo4s19v0SzqmzunP--hm_hep0uLX0ew";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const database = supabase;

/**
 * Upserts the user to the database. Use for login/registration.
 *
 * Supabase has an internal `auth.user` table. Whatever supabase.auth
 * returns needs to be mirrored in the public.user table.
 * Long term, a postgres function could be used for that. Someone might think: that's what a view
 * is for! You're right, but a view does not work with Row-Level-Security.
 */
/*export async function upsertUser(args: {
	user: User;
}): Promise<DatabaseResponse<definitions['user']>> {
	return database
		.from<definitions['user']>('user')
		.upsert({ id: args.user.id, email: args.user.email })
		.single();
}*/
