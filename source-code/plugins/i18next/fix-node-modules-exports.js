import fs from "node:fs"

/**
 * This script fixes the package.json of the typescript package.
 *
 * Exports need to be set manually because esbuild does not support
 * resolving from main.
 */

const path = "./node_modules/typescript/package.json"

const pkg = JSON.parse(fs.readFileSync(path, "utf-8"))

pkg.exports = {
	".": "./lib/typescript.js",
}

fs.writeFileSync(path, JSON.stringify(pkg, undefined, "	"), { encoding: "utf-8" })

console.log("fixed node module exports")
