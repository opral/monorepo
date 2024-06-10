import { vi, it, describe, expect, afterEach } from "vitest"
import { createNodeishMemoryFs } from "../test-utilities/index.js"
import { sleep } from "../test-utilities/sleep.js"
import type { Observer } from "../v2/observables.js"
import { watchFs } from "./watchFs.js"

import fs from "node:fs/promises"
import os from "node:os"
import { join } from "node:path"
import process from "node:process"

// temp dir for node fs tests
const tmpdir = join(os.tmpdir(), "test-sdk-watchFs")

afterEach(async () => {
	// cleanup temp dir carefully
	if (tmpdir.includes("test-sdk-watchFs")) {
		try {
			await fs.rm(tmpdir, { recursive: true })
		} catch (err) {
			// ignore
		}
	}
})

async function testEnvironments() {
	return [
		{
			envName: "node",
			nodeishFs: fs,
			baseDir: await fs.mkdtemp(tmpdir),
		},
		{
			envName: "memory",
			nodeishFs: createNodeishMemoryFs(),
			baseDir: "/test/project.inlang",
		},
	]
}

describe.each(await testEnvironments())(
	"watchFs $envName",
	async ({ envName, nodeishFs, baseDir }) => {
		const waitForWatch = 100
		const isMemory = envName === "memory"

		// Only memoryFs has consistent event counts across OS flavors
		// so we only check for additional watch events, not for exact counts
		// And memoryFs watch seems to prefer forward slashes (not using join)
		// TODO: normalize paths for memoryFs

		const filename1 = "message.json"
		const filepath = isMemory ? baseDir + "/" + filename1 : join(baseDir, filename1)
		const dirname = "subdir"
		const dirpath = isMemory ? baseDir + "/" + dirname : join(baseDir, dirname)
		const filename2 = "foo.bar"
		const dirfilepath = isMemory ? dirpath + "/" + filename2 : join(dirpath, filename2)
		const dirfilename = isMemory ? dirname + "/" + filename2 : join(dirname, filename2)

		it(
			"emits events when files are touched",
			async () => {
				await nodeishFs.mkdir(baseDir, { recursive: true })

				const observer = {
					next: vi.fn(),
					error: vi.fn(),
					complete: vi.fn(),
				} satisfies Observer<string>

				const observable = watchFs({ nodeishFs, baseDir })
				const subscription = observable.subscribe(observer)

				let lastCallCount = observer.next.mock.calls.length

				async function checkForMoreCalls() {
					await sleep(waitForWatch)
					expect(observer.next.mock.calls.length).toBeGreaterThan(lastCallCount)
					lastCallCount = observer.next.mock.calls.length
				}

				async function checkForNoMoreCalls() {
					await sleep(waitForWatch)
					expect(observer.next).toHaveBeenCalledTimes(lastCallCount)
					expect(observer.error).not.toHaveBeenCalled()
				}

				await nodeishFs.writeFile(filepath, "{}")
				await checkForMoreCalls()
				expect(observer.next).toHaveBeenCalledWith(filename1)

				await nodeishFs.rm(filepath)
				await checkForMoreCalls()
				expect(observer.next).toHaveBeenCalledWith(filename1)

				await nodeishFs.mkdir(dirpath, { recursive: true })
				await checkForMoreCalls()
				expect(observer.next).toHaveBeenCalledWith(dirname)

				// node versions <20 do not support recursive watch
				// https://github.com/nodejs/node/pull/45098#issuecomment-1891612491
				if (isMemory || parseInt(process.version.slice(1, 3)) >= 20) {
					await nodeishFs.writeFile(dirfilepath, "{}")
					await checkForMoreCalls()
					expect(observer.next).toHaveBeenCalledWith(dirfilename)
				}

				expect(observer.complete).not.toHaveBeenCalled()
				subscription.unsubscribe()
				await checkForNoMoreCalls()
				expect(observer.complete).toHaveBeenCalledTimes(1)

				await nodeishFs.writeFile(filepath, "{}")
				await checkForNoMoreCalls()
			},
			{ timeout: 5000 }
		)
	}
)
