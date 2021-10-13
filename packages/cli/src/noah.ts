import program from "commander";
import { createClient } from "@supabase/supabase-js";
import { definitions } from "@inlang/database";
//import { importI18next } from "../src/adapters/reacti18n";
import * as fs from "fs";
import * as path from "path";

import { database } from "../../dashboard/src/lib/services/database"; // is this really the best way?

// anon local key, thus okay if it's hardcoded

function ensureJSONExistence(filePath: string) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureJSONExistence(dirname);
  fs.mkdirSync(dirname);
}

async function entry() {
  const args = process.argv;
  program
    .version("0.1.0")
    .option("-p, --project", "project id from dashboard")
    .option("-f, --file", "file path")
    .parse(args);

  let argParsed = program.parse(args).opts();
  let pid = args[3];
  let filepath = args[4];
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
    let x = filepath.split("/")[0];
    localefiles[x] = filepath;
  } else if (filepath === ".") {
    //  console.log("filesync", fs.readFileSync("./"));
    const locales = fs.readdirSync("./");
    for (let x of locales) {
      localefiles[x] = x.concat("translation.json");
    }
  } else {
    console.error("Seems like there is an error in the filepath");
  }

  for (let x in localefiles) {
    // iterate over all locales
    //load in locale
    const dataObject = JSON.parse(fs.readFileSync(filepath).toString()); // is it best practice that const has type any
    for (let y in dataObject) {
      database.from<definitions["key"]>("key").upsert({
        project_id: pid,
        name: y,
        description: "",
        created_at: new Date().toLocaleString(),
      });
    }
    for (let z in dataObject) {
      database.from<definitions["translation"]>("translation").upsert({
        key_name: z,
        project_id: pid,
        iso_code: "en",
        is_reviewed: false,
        text: dataObject[z],
        created_at: new Date().toLocaleString(),
      });
    }
  }
}

entry();
