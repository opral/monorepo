import { test, expect, vi, beforeAll, beforeEach } from "vitest"
import { initCommand } from "./init.js"
import consola from "consola"

beforeAll(() => {
	// Redirect std and console to consola too
	// Calling this once is sufficient
	consola.wrapAll()
})

beforeEach(() => {
	// Re-mock consola before each test call to remove
	// calls from before
	consola.mockTypes(() => vi.fn())
})

test("it should log true if the user has an existing project", async () => {
	mockUserInput([true])
	await initCommand.parseAsync()
	expect(consola.log).toHaveBeenLastCalledWith(true)
})

test("it should log false if the user has an existing project", async () => {
	mockUserInput([false])
	await initCommand.parseAsync()
	expect(consola.log).toHaveBeenLastCalledWith(false)
})

// test("the paraglide plugin for vscode should be installed", () => {
// 	throw new Error("Not implemented")
// })

// test("it sets the tsconfig compiler option 'moduleResolution' to 'bundler'", () => {
// 	throw new Error("Not implemented")
// })

// test("it should create a project if it doesn't exist", () => {
// 	test("the inlang message format should be the default selection", () => {
// 		throw new Error("Not implemented")
// 	})
// })

// test("the vscode extension should be added to the workspace recommendations", () => {
// 	test("automatically if the .vscode folder exists", () => {
// 		throw new Error("Not implemented")
// 	})
// 	test("else, the user should be prompted if the vscode extension should be added", () => {
// 		throw new Error("Not implemented")
// 	})
// })

// describe("it should prompt the user if the cli should be added for linting and machine translations", () => {
// 	test("the cli should be added to the devDependencies", () => {
// 		throw new Error("Not implemented")
// 	})
// 	test("if a lint script exists, inlang lint should be added to the lint script", () => {
// 		throw new Error("Not implemented")
// 	})
// 	test("if no lint script exists, the lint script should be created in the package.json", () => {
// 		throw new Error("Not implemented")
// 	})
// })

// test("the user should be prompted for the framework and forwarded to the corresponding guide", () => {
// 	throw new Error("Not implemented")
// })

// --- SETUP TEST INPUT CONSUMER ---
const mockUserInput = (testUserInput: any[]) => {
	vi.spyOn(consola, "prompt").mockImplementation(() => {
		const value = testUserInput.shift()
		if (value === undefined) {
			throw new Error("End of test input")
		}
		return value
	})
}
