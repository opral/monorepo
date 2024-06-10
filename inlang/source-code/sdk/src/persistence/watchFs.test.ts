import { vi, it, describe, expect, afterEach } from "vitest"
import { createNodeishMemoryFs } from "../test-utilities/index.js"
import { sleep } from "../test-utilities/sleep.js"
import type { Observer } from "../v2/observables.js"
import { watchFs } from "./watchFs.js"

import fs from "node:fs/promises"
import os from "node:os"
import { join } from "node:path"

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

describe.each(await testEnvironments())("watchFs $envName", async ({ nodeishFs, baseDir }) => {
	const waitForWatch = 100
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

			await nodeishFs.writeFile(baseDir + "/messages.json", "{}")
			await sleep(waitForWatch)

			expect(observer.next).toHaveBeenCalledTimes(1)
			expect(observer.next).toHaveBeenCalledWith("messages.json")

			await nodeishFs.rm(baseDir + "/messages.json")
			await sleep(waitForWatch)

			expect(observer.next).toHaveBeenCalledTimes(2)
			expect(observer.next).toHaveBeenCalledWith("messages.json")

			await nodeishFs.mkdir(baseDir + "/subdir", { recursive: true })
			await sleep(waitForWatch)

			expect(observer.next).toHaveBeenCalledTimes(3)
			expect(observer.next).toHaveBeenCalledWith("subdir")

			await nodeishFs.writeFile(baseDir + "/subdir/foo.bar", "{}")
			await sleep(waitForWatch)

			expect(observer.next).toHaveBeenCalledTimes(4)
			expect(observer.next).toHaveBeenCalledWith("subdir/foo.bar")

			// should complete without more events
			subscription.unsubscribe()
			await sleep(waitForWatch)

			expect(observer.next).toHaveBeenCalledTimes(4)
			expect(observer.error).not.toHaveBeenCalled()
			expect(observer.complete).toHaveBeenCalledTimes(1)

			// should not emit any more events
			await nodeishFs.writeFile(baseDir + "/messages.json", "{}")
			await sleep(waitForWatch)

			expect(observer.next).toHaveBeenCalledTimes(4)
			expect(observer.error).not.toHaveBeenCalled()
			expect(observer.complete).toHaveBeenCalledTimes(1)
		},
		{ timeout: 5000 }
	)
})
