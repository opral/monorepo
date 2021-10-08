import { PostgrestResponse } from "@supabase/supabase-js";

export async function pgres2val<t>(x: PostgrestResponse<t>) {
    if (x.error || x.data === null) {
        throw 'ygg'
    } else {
        return x.data;
    }
}