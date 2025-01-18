import { describe, it, expect } from "vitest"
import { maybeUpdateViteConfig } from "./addVitePlugin"

describe("maybeUpdateViteConfig", () => {
	it("updates sveltekit's default vite.config.ts", () => {
		const config = `import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [sveltekit()],
})
`
		const result = maybeUpdateViteConfig(config)
		expect(result.ok).toBe(true)
		expect(result.updated).toMatchInlineSnapshot(`
			"import { paraglide } from '@inlang/paraglide-sveltekit/vite'
			import { sveltekit } from "@sveltejs/kit/vite"
			import { defineConfig } from "vite"

			export default defineConfig({
				plugins: [paraglide({ project: './project.inlang', outdir: './src/lib/paraglide' }),sveltekit()],
			})
			"
		`)
	})

	it("doesn't update configs where the paraglide plugin is already present", () => {
		const config = `
        import { sveltekit } from "@sveltejs/kit/vite"
        import { paraglide } from "@inlang/paraglide-sveltekit/vite"
        import { visualizer } from "rollup-plugin-visualizer"
        import { defineConfig } from "vite"
        
        export default defineConfig({
            plugins: [
                paraglide({
                    project: "./project.inlang",
                    outdir: "./src/paraglide",
                }),
                sveltekit(),
                visualizer({
                    filename: "stats.html",
                    emitFile: true,
                }),
            ],
        })        
`
		const result = maybeUpdateViteConfig(config)
		expect(result.ok).toBe(false)
	})
})
