import program from "commander";
import { createClient } from "@supabase/supabase-js";
import { definitions } from "@inlang/database";
//import { importI18next } from "../src/adapters/reacti18n";
import * as fs from "fs";
import * as path from "path";

import { database } from "../../dashboard/src/lib/services/database"; // is this really the best way?

// anon local key, thus okay if it's hardcoded
const supabase = createClient(
  "http://localhost:8000",
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoyNTUwNjUzNjM0LCJyb2xlIjoiYW5vbiJ9.36fUebxgx1mcBo4s19v0SzqmzunP--hm_hep0uLX0ew"
);

async function entry() {
  const args = process.argv;
  program
    .version("0.1.0")
    .option("-p, --project", "project id from dashboard")
    .option("-f, --file", "file path")
    .parse(args);

  let argParsed = program.parse(args).opts();
  let pid = args[4];
  let filepath = args[6];
  if (!argParsed.project === null) {
    pid = argParsed.project;
    filepath = argParsed.file;
  }
  if (!pid) {
    console.error("you must give project id with the -p flag");
  }
  //add all locales to list
  let localefiles: any = {};

  if (filepath.includes(".json")) {
    let locale = filepath.split("/")[0];
    localefiles[locale] = filepath;
  } else if (filepath === ".") {
    const locales = fs.readdirSync("./");
    for (let locale of locales) {
      localefiles[locale] = locale.concat("/translation.json");
    }
  } else {
    console.error("Seems like there is an error in the filepath");
  }

  for (let locale in localefiles) {
    // iterate over all locales
    //load in locale
    const dataObject = JSON.parse(fs.readFileSync(localefiles[locale]).toString()); // is it best practice that const has type any
    console.log(dataObject);
    
    for (let y in dataObject) {
      supabase.from<definitions["key"]>("key").upsert({
        project_id: pid,
        name: y,
        description: "",
        created_at: new Date().toLocaleString(),
      });
    }
    for (let z in dataObject) {
      supabase.from<definitions["translation"]>("translation").upsert({
        key_name: z,
        project_id: pid,
        iso_code: <definitions['language']['iso_code']>locale,
        is_reviewed: false,
        text: dataObject[z],
        created_at: new Date().toLocaleString(),
      });
    }
    
  }
}

entry();
