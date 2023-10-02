#!/usr/bin/env node

// the comment above signals unix environments which interpreter
// to use when executing this file (node)

import { cli } from "../dist/cli/index.js"
import { compile } from "../dist/compiler/compile.js"

cli({ compile, name: "paraglide-js" })