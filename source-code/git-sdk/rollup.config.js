import { wasm } from "@rollup/plugin-wasm"
import typescript from "@rollup/plugin-typescript"

export default {
	input: "src/api/index.ts",
	output: {
		dir: "dist",
		format: "es",
	},
	plugins: [
		// bundle wasm code
		wasm(),
		// compile typescript
		typescript(),
	],
}
