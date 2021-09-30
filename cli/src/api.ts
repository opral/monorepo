import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function testReadProjs() {
    let sb = newSupabase()
    let r = sb.from("projects").select("*") // works with policy
    r.then(x => console.log(x))

}

export async function test_getJson() {
    let sb = newSupabase()
    let u = await login(sb)
    // u.then(x => getData(sb, x.id))
    let jsonStr = getData(sb, u.id)
    return jsonStr
}

/** http apis  */
function newSupabase() {

    // Create a single supabase client for interacting with your database
    let sb = createClient(
        'https://jxaqemnoabezizetynth.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMTcxNDM1NywiZXhwIjoxOTQ3MjkwMzU3fQ.aKT6sg-vJjnCUNitwy9HrIpl1rVAaP9NWIc9K7WFu6w')
    // login(sb)
    return sb
}

// https://supabase.io/docs/reference/javascript/select
async function getData(sb: SupabaseClient, loggedInUserId: string) {
    // const rr = sb.from("where userid=1").select("json")
    // userid => permissions=>projects=>id of translations
    // const r = await sb.from('cities').select()
    // const loggedInUserId = 'd0714948'
    let { data, error } = await sb.from('users').select('user_id, name').eq('user_id', loggedInUserId)
    return data
}




// todo : how to auth?
async function login(sb: SupabaseClient) {
    let { user, session, error } = await sb.auth.signIn({
        email: 'example@email.com',
        password: 'example-password',
    })
    // user.id
    // sb.auth.api.getUserByCookie("")
    // user.
    return user
}

/* from db table to json */
function table2json() {

}