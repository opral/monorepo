#!/usr/bin/env node

import program from 'commander'

import { orderPizza } from './index'
 
program
  .version('0.1.0')
  .option('-p, --peppers', 'Add peppers')
  .option('-P, --pineapple', 'Add pineapple')
  .option('-b, --bbq-sauce', 'Add bbq sauce')
  .option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
  .parse(process.argv)

orderPizza({
  peppers: program.peppers,
  pineapple: program.pineapple,
  bbqSauce: program.bbqSauce,
  cheeseType: program.cheese
}).then(result => console.log(result.message))
