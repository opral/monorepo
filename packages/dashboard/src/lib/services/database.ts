import { createClient, PostgrestResponse, User } from '@supabase/supabase-js';
import type { definitions } from '@inlang/database/types/definitions';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const database = supabase;

/**
 * Upserts the user to the database. Use for login/registration.
 *
 * Supabase has an internal `auth.user` table. Whatever supabase.auth
 * returns needs to be mirrored in the public.user table.
 * Long term, a postgres function could be used for that. Someone might think: that's what a view
 * is for! You're right, but a view does not work with Row-Level-Security.
 */
export async function upsertUser(args: {
	user: User;
}): Promise<PostgrestResponse<definitions['user']>> {
	return database
		.from<definitions['user']>('user')
		.upsert({ id: args.user.id, email: args.user.email });
}
