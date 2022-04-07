import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getServerSideEnv } from './serverSideEnv';

// is a function to not be required to load the dotenv in the global file
// (complicates other imports that do not require dotenv/env variables.)
export function createServerSideSupabaseClient(): SupabaseClient {
	const env = getServerSideEnv();
	if (env['VITE_PUBLIC_SUPABASE_URL'] === undefined || env['SUPABASE_SECRET_KEY'] === undefined) {
		throw 'Environment variables are either non-existend or the names not updated.';
	}
	return createClient(env['VITE_PUBLIC_SUPABASE_URL'], env['SUPABASE_SECRET_KEY']);
}
