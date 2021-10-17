import { definitions } from '@inlang/database';
import { createServerSideSupabaseClient } from '../_utils/serverSideServices';
import * as dotenv from 'dotenv';

export async function getUserId(email: string): Promise<string> {
    dotenv.config();
    
    const supabase = createServerSideSupabaseClient();
    const user = await supabase.from<definitions["user"]>("user")
        .select()
        .match({
            email: email
        });
    if (user.error) {
        throw user.error
    } else {
        return user.data[0].id;
    }
}