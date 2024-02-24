import { beforeEach, describe, expect, it } from "vitest"
import childProcess from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { promisify } from "node:util"
const exec = promisify(childProcess.exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const repoI18next = join(__dirname, "../load-test/repo-i18next")
const cli = join(__dirname, "../../cli/bin/run.js")
const translateCommand = cli + " machine translate -f --project ./project.inlang"

describe.skipIf(!process.env.MOCK_TRANSLATE)("load test", () => {
	beforeEach(async () => {
		await cleanupTranslations()
		await generateEnglishMessages()
	})

	// If you see a vitest error here, when running this test from VS Code
	// try setting the "vitest commandline" option in the extension settings to "pnpm vitest"
	it("should work", async () => {
		await exec(translateCommand, { cwd: repoI18next })
		expect(true).toBe(true)
		// eslint-disable-next-line no-console
		console.log("it's fine")
	})
})

async function cleanupTranslations() {
	await exec("pnpm clean", { cwd: repoI18next })
}

async function generateEnglishMessages() {}
