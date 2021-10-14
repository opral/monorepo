import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// is a function to not be required to load the dotenv in the global file
// (complicates other imports that do not require dotenv/env variables.)
export function createServerSideSupabaseClient(): SupabaseClient {
	dotenv.config();
	if (
		process.env['VITE_PUBLIC_SUPABASE_URL'] === undefined ||
		process.env['SUPABASE_SECRET_KEY'] === undefined
	) {
		throw 'Environment variables are either non-existend or the names not updated.';
	}
	return createClient(process.env['VITE_PUBLIC_SUPABASE_URL'], process.env['SUPABASE_SECRET_KEY']);
}
