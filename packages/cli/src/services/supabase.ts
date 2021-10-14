import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as os from 'os';

// read envir like supabase from user provided file under lang

export function readEnvir() {
  let dir = os.homedir() + '/inlang.json'
  console.log("reading config from : " + dir)
  try {
    let s = fs.readFileSync(dir, 'utf8');
    console.log("find config file at " + dir)
    let jo = JSON.parse(s)

    const supabase = createClient(
      jo.url,
      jo.key
    );
    return supabase
  }
  catch (e) {
    console.log("please put config file at")
    // console.log(e);
  }
}