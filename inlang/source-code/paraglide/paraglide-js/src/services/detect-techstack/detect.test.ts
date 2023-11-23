import { createNodeishMemoryFs } from "@inlang/sdk/test-utilities"
import { detectTechStack } from "./detect.js"
import memfs from "memfs"
import fsSync from "fs"
import fs from "node:fs/promises"
import { describe, expect, test, vi } from "vitest"

describe("detectTechStack", () => {
	test("it should detect SvelteKit", async () => {
		mockFiles({
			//Leave extra dependencies in to make sure they don't cause false negatives
			"package.json": `{
				"devDependencies": {
					"@sveltejs/adapter-auto": "^2.0.0",
					"@sveltejs/kit": "^1.5.0",
					"svelte": "^3.54.0",
					"svelte-check": "^3.0.1",
					"tslib": "^2.4.1",
					"typescript": "^5.0.0",
					"vite": "^4.2.0"
				}
			}`,
		})

		expect(await detectTechStack()).toBe("sveltekit")
	})

	test("it should detect SolidStart", async () => {
		mockFiles({
			//Leave extra dependencies in to make sure they don't cause false negatives
			"package.json": `{
				"devDependencies": {
					"@types/node": "^18.17.5",
					"esbuild": "^0.14.54",
					"postcss": "^8.4.28",
					"solid-start-node": "^0.3.10",
					"typescript": "^4.9.5",
					"vite": "^4.4.9"
				},
				"dependencies": {
					"@solidjs/meta": "^0.29.1",
					"@solidjs/router": "^0.8.3",
					"solid-js": "^1.8.5",
					"solid-start": "^0.3.10"
				}
			}`,
		})

		expect(await detectTechStack()).toBe("solid-start")
	})

	test("it should detect Next.js", async () => {
		mockFiles({
			//Leave extra dependencies in to make sure they don't cause false negatives
			"package.json": `{
                "dependencies": {
                    "react": "^18",
                    "react-dom": "^18",
                    "next": "14.0.3"
                },
                  "devDependencies": {
                    "typescript": "^5",
                    "@types/node": "^20",
                    "@types/react": "^18",
                    "@types/react-dom": "^18"
                }
			}`,
		})

		expect(await detectTechStack()).toBe("next")
	})

	test("it should standalone vite", async () => {
		mockFiles({
			//Leave extra dependencies in to make sure they don't cause false negatives
			"package.json": `{
                "devDependencies": {
                    "vite": "^4.2.0"
                }
			}`,
		})

		expect(await detectTechStack()).toBe("vite")
	})

	test("it should standalone rollup", async () => {
		mockFiles({
			//Leave extra dependencies in to make sure they don't cause false negatives
			"package.json": `{
                "devDependencies": {
                    "rollup": "^4.2.0"
                }
			}`,
		})

		expect(await detectTechStack()).toBe("rollup")
	})

	test("it should standalone webpack", async () => {
		mockFiles({
			//Leave extra dependencies in to make sure they don't cause false negatives
			"package.json": `{
                "devDependencies": {
                    "webpack": "^5.0.0"
                }
			}`,
		})

		expect(await detectTechStack()).toBe("webpack")
	})

	test("it should admit when it has no idea what this is", async () => {
		mockFiles({
			//Leave extra dependencies in to make sure they don't cause false negatives
			"package.json": `{
                "devDependencies": {
                    "jeremy": "^4.2.0"
                }
			}`,
		})

		expect(await detectTechStack()).toBe("other")
	})
})

const mockFiles = (files: memfs.NestedDirectoryJSON) => {
	const _memfs = memfs.createFsFromVolume(memfs.Volume.fromNestedJSON(files))
	const lixFs = createNodeishMemoryFs()
	vi.spyOn(fsSync, "existsSync").mockImplementation(_memfs.existsSync)
	for (const prop in fs) {
		// @ts-ignore - memfs has the same interface as node:fs/promises
		if (typeof fs[prop] !== "function") continue

		// @ts-ignore - memfs dies not have a watch interface - quick fix should be updated
		if (fs[prop].name === "watch") {
			// @ts-ignore - memfs has the same interface as node:fs/promises
			vi.spyOn(fs, prop).mockImplementation(lixFs[prop])
		} else {
			// @ts-ignore - memfs has the same interface as node:fs/promises
			vi.spyOn(fs, prop).mockImplementation(_memfs.promises[prop])
		}
	}
	return { existsSync: _memfs.existsSync }
}
