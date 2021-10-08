import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { definitions } from '@inlang/database'
import { supabase } from './services/supabase';
import * as conv from './conversion'

export async function test_getJson() {

}

export function testReadProjs() {
    let sb = supabase
    let r = sb.from("projects").select("*") // works with policy
    r.then(x => console.log(x))
}