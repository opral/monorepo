#!/usr/bin/env node

import program from 'commander'
import { download2prj } from './api'
import { readEnvir } from './services/supabase'


/** binary entry  
 * https://github.com/tj/commander.js/
 * 
*/
function entry() {
  const args = process.argv
  program
    .version('0.1.0')
    .option('-p, --project', 'project id from dashboard')
    .parse(args)

  let argParsed = program.parse(args).opts()
  let pid = args[3]
  // if no 
  if (!argParsed.project === null) pid = argParsed.project
  if (pid === null) console.log("please provide project id from dashboard")

  console.log(pid)
  download2prj(pid)
  // token expire,please provide a new one from dashboard
}

entry()