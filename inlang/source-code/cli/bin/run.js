#!/usr/bin/env node

// the comment above signals unix environments which interpreter
// to use when executing this file (node)

import { cli } from "../dist/main.js"

try {
	cli.parse()
} catch (error) {
	console.error(error)
}
