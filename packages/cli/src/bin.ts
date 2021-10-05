#!/usr/bin/env node

// https://github.com/khalidx/typescript-cli-starter
import program from 'commander'
import { testReadProjs, test_getJson } from './api'

import type { definitions } from '@inlang/database'
// import type { definitions } from '../../database/types/definitions'


/** binary entry  */

function entry() {
  program
    .version('0.1.0')
    .option('-p, --peppers', 'Add peppers')
    .option('-P, --pineapple', 'Add pineapple')
    .option('-b, --bbq-sauce', 'Add bbq sauce')
    .option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
    .parse(process.argv)


  // testReadProjs()
  test_getJson()
}

entry()