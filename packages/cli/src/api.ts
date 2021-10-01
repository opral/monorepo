import { createClient, SupabaseClient } from '@supabase/supabase-js'

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
async function getData(sb: SupabaseClient, loggedInUserId: string) {
    // old: userid => permissions=>projects=>id of translations
    //new : user -> org -> project -> keys
    let { data, error } = await sb.from('user').select('user_id, name').eq('user_id', loggedInUserId)
    return data
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
