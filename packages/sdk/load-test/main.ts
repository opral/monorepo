/* eslint-disable no-console */
import { runLoadTest } from "./load-test.js"

const usage = `
USAGE: pnpm test [messageCount] [translate] [subscribeToMessages] [subscribeToLintReports]
e.g.
      pnpm test 300
      pnpm test 100 1 1 0

Defaults: translate: 1, subscribeToMessages: 1, subscribeToLintReports: 0
`

if (numArg(2)) {
	await runLoadTest(numArg(2), boolArg(3), boolArg(4), boolArg(5))
} else {
	console.log(usage)
}

function numArg(n: number) {
	return Number(process.argv[n])
}

function boolArg(n: number) {
	return isNaN(numArg(n)) ? undefined : !!numArg(n)
}
