import * as path from "node:path"
import Mocha from "mocha"
import { glob } from "glob"

export async function run() {
	// Create the mocha test
	const mocha = new Mocha({
		ui: "tdd",
	})

	const testsRoot = path.resolve(__dirname)

	const tests = await glob("**/*.e2e.test.cjs", { cwd: testsRoot })

	return new Promise<void>((resolve, reject) => {
		for (const f of tests) {
			mocha.addFile(path.resolve(testsRoot, f))
		}

		try {
			// Run the mocha test
			mocha.run((failures) => {
				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`))
				} else {
					resolve()
				}
			})
		} catch (err) {
			console.error(err)
			reject(err)
		}
	})
}
