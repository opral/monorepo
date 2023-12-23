import { createBundle } from "dts-buddy"

await createBundle({
	output: "./types/index.d.ts",
	modules: {
		"@inlang/valid-js-identifier": "./src/index.js",
	},
})
