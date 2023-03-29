import { expect, it } from "vitest"
import { fs as memfs } from "memfs"
import { mockEnvironment } from "./mockEnvironment.js"
import type { EnvironmentFunctions } from "../config/schema.js"

it("should copy a directory into the environment", async () => {
	// to test with node (a real filesystem), outcomment this line and
	// import fs from "node:fs/promises" above.
	const fs = memfs.promises as EnvironmentFunctions["$fs"]
	await fs.mkdir("./test", { recursive: true })
	await fs.writeFile("./test/file.txt", "Hello World!")
	await fs.mkdir("./test/subdir", { recursive: true })
	await fs.writeFile("./test/subdir/file.txt", "Hello World!")

	const env = await mockEnvironment({ copyDirectory: { fs, paths: ["test"] } })
	expect(await env.$fs.readFile("./test/file.txt", { encoding: "utf-8" })).toBe("Hello World!")
	expect(await env.$fs.readFile("./test/subdir/file.txt", { encoding: "utf-8" })).toBe(
		"Hello World!",
	)
})

it("should copy multiple directories into the environment", async () => {
	// to test with node (a real filesystem), outcomment this line and
	// import fs from "node:fs/promises" above.
	const fs = memfs.promises as EnvironmentFunctions["$fs"]
	await fs.mkdir("./one", { recursive: true })
	await fs.writeFile("./one/file.txt", "Hello from one")
	await fs.mkdir("./two/subdir", { recursive: true })
	await fs.writeFile("./two/file.txt", "Hello from two")

	const env = await mockEnvironment({ copyDirectory: { fs, paths: ["one", "two"] } })
	expect(await env.$fs.readFile("./one/file.txt", { encoding: "utf-8" })).toBe("Hello from one")
	expect(await env.$fs.readFile("./two/file.txt", { encoding: "utf-8" })).toBe("Hello from two")
})

it("should be able to import JavaScript from the environment", async () => {
	const fs = memfs.promises as EnvironmentFunctions["$fs"]
	await fs.mkdir("./test", { recursive: true })
	await fs.writeFile("./test/file.js", "export const x = 'hello'")
	const env = await mockEnvironment({ copyDirectory: { fs, paths: ["./test"] } })
	const { x } = await env.$import("./test/file.js")
	expect(x).toBe("hello")
})

it("should give an error if the path does not exist (hinting at a current working directory problem)", async () => {
	const fs = memfs.promises as EnvironmentFunctions["$fs"]
	// relative imports are relative to the current working directory, not the file.
	// thus, if you run the tests from the root of the project, the path will be wrong.
	try {
		await mockEnvironment({ copyDirectory: { fs, paths: ["../test"] } })
	} catch (error) {
		expect(
			(error as Error).message.includes(
				`Make sure that the \`copyDirectory.path\` is relative to the current working directory`,
			),
		).toBe(true)
	}
})
