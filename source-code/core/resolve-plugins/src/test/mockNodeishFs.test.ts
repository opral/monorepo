import { expect, it } from "vitest"
import { createNodeishMemoryFs } from "@lix-js/fs"
import { createMockNodeishFs } from "./mockNodeishFs.js"

it("should copy a directory into the environment", async () => {
	// to test with node (a real filesystem), outcomment this line and
	// import fs from "node:fs/promises" above.
	const fs = createNodeishMemoryFs()
	await fs.mkdir("./test")
	await fs.writeFile("./test/file.txt", "Hello World!")
	await fs.mkdir("./test/subdir")
	await fs.writeFile("./test/subdir/file.txt", "Hello World!")

	const mockFs = await createMockNodeishFs({ copyDirectory: { fs, paths: ["test"] } })
	expect(await mockFs.readFile("./test/file.txt", { encoding: "utf-8" })).toBe("Hello World!")
	expect(await mockFs.readFile("./test/subdir/file.txt", { encoding: "utf-8" })).toBe(
		"Hello World!",
	)
})

it("should copy multiple directories into the environment", async () => {
	// to test with node (a real filesystem), outcomment this line and
	// import fs from "node:fs/promises" above.
	const fs = createNodeishMemoryFs()
	await fs.mkdir("./one")
	await fs.writeFile("./one/file.txt", "Hello from one")
	await fs.mkdir("./two/subdir", { recursive: true })
	await fs.writeFile("./two/file.txt", "Hello from two")

	const mockFs = await createMockNodeishFs({ copyDirectory: { fs, paths: ["one", "two"] } })
	expect(await mockFs.readFile("./one/file.txt", { encoding: "utf-8" })).toBe("Hello from one")
	expect(await mockFs.readFile("./two/file.txt", { encoding: "utf-8" })).toBe("Hello from two")
})

it("should give an error if the path does not exist (hinting at a current working directory problem)", async () => {
	const fs = createNodeishMemoryFs()
	// relative imports are relative to the current working directory, not the file.
	// thus, if you run the tests from the root of the project, the path will be wrong.
	try {
		await createMockNodeishFs({ copyDirectory: { fs, paths: ["../test"] } })
	} catch (error) {
		expect(
			(error as Error).message.includes(
				`Make sure that the \`copyDirectory.path\` is relative to the current working directory`,
			),
		).toBe(true)
	}
})
