import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;
let supabase;
if (supabaseUrl !== undefined && supabaseAnonKey !== undefined) {
	supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
	throw new Error('Supabase information not supplied in .env');
}

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
