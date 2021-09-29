import { createClient, PostgrestResponse } from '@supabase/supabase-js';
import type { definitions } from '@inlang/database/types/definitions';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const database = supabase;

/**
 * Example showing how to use types to build queries and throughout the project.
 *
 * Everything type is defined in definitons e.g. definitions['project'] or defintions['translation'].
 * You can even get subtypes like defintions['project']['id']
 *
 */
export async function exampleQuery(): Promise<PostgrestResponse<definitions['project']>> {
	return database.from<definitions['project']>('project').select('*');
}
