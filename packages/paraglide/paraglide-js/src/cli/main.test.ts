import { describe, test, expect, vi } from "vitest"
import { _setStateForTest } from "./state.js"
import { cli } from "./main.js"
import consola from "consola"

// surpress output for clean test output
cli.configureOutput({ writeErr: () => {}, writeOut: () => {} })

describe("it should exit if the CLI is not running from the dist folder", () => {
	const shouldSucceed = [
		"/Users/example/repository/node_modules/paraglide-js",
		"/node_modules/paraglide-js",
		// windows... https://github.com/inlang/monorepo/issues/1478
		"C:\\Users\\Projects\\svelte-one\\node_modules\\@inlang\\paraglide-js",
	]

	const shouldFail = ["/Users/samuel/example/repository"]

	const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
	// remove error message to have clean test output
	vi.spyOn(consola, "error").mockImplementation(() => undefined as never)

	for (const path of shouldSucceed) {
		test("suceed with " + path, async () => {
			// surpress output to have clean test output
			_setStateForTest({
				paraglideDirectory: path,
			})
			await cli.parseAsync([])
			expect(exitSpy).toHaveBeenLastCalledWith(0)
		})
	}

	for (const path of shouldFail) {
		test("fail with " + path, async () => {
			_setStateForTest({
				paraglideDirectory: path,
			})
			await cli.parseAsync([])
			expect(exitSpy).toHaveBeenLastCalledWith(1)
		})
	}
})
