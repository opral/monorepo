import { PostgrestResponse } from "@supabase/supabase-js";

export async function pgResp2val<t>(x: PostgrestResponse<t>): Promise<t[]> {
    if (x.error || x.data === null) {
        throw 'oops'
    } else {
        return x.data;
    }
}

