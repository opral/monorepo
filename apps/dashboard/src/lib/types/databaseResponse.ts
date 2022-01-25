import { PostgrestError } from '@supabase/postgrest-js';

export interface DatabaseResponse<T> {
	data: T | null;
	error: PostgrestError | null;
}
