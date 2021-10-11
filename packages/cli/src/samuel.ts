#!/usr/bin/env node

import program from "commander";
import { createClient } from "@supabase/supabase-js";
import { definitions } from "@inlang/database";
import { exportI18nNext } from "../src/adapters/reacti18n";
import * as fs from "fs";
import * as path from "path";

// anon local key, thus okay if it's hardcoded
const supabase = createClient(
  "http://localhost:8000",
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoyNTUwNjUzNjM0LCJyb2xlIjoiYW5vbiJ9.36fUebxgx1mcBo4s19v0SzqmzunP--hm_hep0uLX0ew"
);

function ensureDirectoryExistence(filePath: string) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

async function entry() {
  const args = process.argv;
  program
    .version("0.1.0")
    .option("-p, --project", "project id from dashboard")
    .parse(args);

  let argParsed = program.parse(args).opts();
  let pid = args[3];
  if (!argParsed.project === null) {
    pid = argParsed.project;
  }
  if (!pid) {
    console.error("you must give project id with the -p flag");
  }
  const translations = await supabase
    .from<definitions["translation"]>("translation")
    .select()
    .match({ project_id: pid });
  if (translations.data === null || translations.error) {
    console.error(
      "Something went wrong fetching the translations. Does the project exist?"
    );
    return;
  }
  const exportNext = exportI18nNext({ translations: translations.data });
  for (const file of exportNext.files) {
    //   null, 4 beautifies the json
    ensureDirectoryExistence(file.path);
    fs.writeFileSync(file.path, JSON.stringify(file.content, null, 4));
  }
}

entry();
