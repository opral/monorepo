import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { definitions } from '@inlang/database'
// import {}  from "@inlang/dashboard/src/lib/stores/projectStore"
// import * as i from '@inlang/'
let tok = ""

export function testReadProjs() {
    let sb = newSupabase()
    let r = sb.from("projects").select("*") // works with policy
    r.then(x => console.log(x))
}

export async function test_getJson() {
    let sb = newSupabase()
    let u = await login(sb, tok)
    console.log(u)
    // u.then(x => getData(sb, x.id))
    let jsonStr = ""// getData(sb, u.id)
    return jsonStr

}

/** http apis  */
export function newSupabase() {

    // Create a single supabase client for interacting with your database
    // let sb = createClient(
    //     'https://jxaqemnoabezizetynth.supabase.co',
    //     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMTcxNDM1NywiZXhwIjoxOTQ3MjkwMzU3fQ.aKT6sg-vJjnCUNitwy9HrIpl1rVAaP9NWIc9K7WFu6w')

    let sb = createClient(
        'https://cqriunspsjhvrvcazqri.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMjk5MDU0NCwiZXhwIjoxOTQ4NTY2NTQ0fQ.liAxCtDEkgqyslW1xtN5lpcUJMROiUj1Rsar67eoW00')
    // login(sb)
    return sb
}

// https://supabase.io/docs/reference/javascript/select
async function readData(sb: SupabaseClient, loggedInUserId: string) {
    // old: userid => permissions=>projects=>id of translations
    //new : user -> org -> project -> keys
    // const x: definitions['user'] | null = null
    // x.id
    // let usersO = await sb.from<definitions['user']>('user').select('*').eq('id', loggedInUserId).single()
    // usersO.data.
    // let orgO = await sb.from<definitions['organization']>('organization').select('*').eq('id', loggedInUserId).single()
    // just select all projs,non authed will not be returned
    let progO = await sb.from<definitions['project']>('project').select('*').eq('id', loggedInUserId).single()
    // sometable.user.id.
    // return usersO.data
}

async function writeData(sb: SupabaseClient, loggedInUserId: string, json: String) {
    // userid => permissions=>projects=>id of translations
    // let { data, error } = await sb.from('user').select('user_id, name').eq('user_id', loggedInUserId)

    // sb.from("").upsert("", "")
    let { data, error } = await sb.from('messages').upsert({ id: 3 })
    // return data
}

// todo : how to auth?
async function login(sb: SupabaseClient, jwt: string) {
    let x = await sb.auth.api.getUser(jwt) // token works
    let user = x.user
    console.log(x.error)
    // user
    /* let { user, session, error } = await sb.auth.signIn({
        email: 'example@email.com',
        password: 'example-password',
    }) */
    // user.id
    // sb.auth.api.getUserByCookie("")
    // user.
    return user
}
