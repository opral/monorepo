import { expect, it } from "vitest"
import { fs as memfs } from "memfs"
import { mockEnvironment } from "./mockEnvironment.js"
import type { EnvironmentFunctions } from "../config/schema.js"
// import fs from "node:fs/promises"

it("should copy a directory into the environment", async () => {
	// to test with node (a real filesystem), outcomment this line and
	// import fs from "node:fs/promises" above.
	const fs = memfs.promises as EnvironmentFunctions["$fs"]
	await fs.mkdir("./test", { recursive: true })
	await fs.writeFile("./test/file.txt", "Hello World!")
	await fs.mkdir("./test/subdir", { recursive: true })
	await fs.writeFile("./test/subdir/file.txt", "Hello World!")

	const env = await mockEnvironment({ copyDirectory: { fs, path: "test" } })
	expect(await env.$fs.readFile("./test/file.txt", { encoding: "utf-8" })).toBe("Hello World!")
	expect(await env.$fs.readFile("./test/subdir/file.txt", { encoding: "utf-8" })).toBe(
		"Hello World!",
	)
})

it("should be able to import JavaScript from the environment", async () => {
	const fs = memfs.promises as EnvironmentFunctions["$fs"]
	await fs.mkdir("./test", { recursive: true })
	await fs.writeFile("./test/file.js", "export const x = 'hello'")
	const env = await mockEnvironment({ copyDirectory: { fs, path: "./test" } })
	const { x } = await env.$import("./test/file.js")
	expect(x).toBe("hello")
})
