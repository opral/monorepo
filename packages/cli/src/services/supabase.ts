

import * as fs from 'fs';



// read envir like supabase from user provided file under lang
export function readEnvir() {
  try {
    let s = fs.readFileSync('inlang.json', 'utf8');
    console.log("find config file at")
    let jo = JSON.parse(s)
    jo.url
    jo.key
  }
  catch (e) {
    console.log("please put config file at")
    console.log(e);
  }
}

// todo : use file
/*
// import dotenv from "dotenv";
dotenv.config();
export const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL as string,
  process.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string
); */
