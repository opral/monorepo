import { describe, it, expect } from "vitest"
import { connectToRepo, exposeRepoOn } from "./index.js"
import { mockRepo } from "@lix-js/client/src/mockRepo.ts"

describe("rpc repo", () => {
	it("can get the first commit hash", async () => {
		const repo = await mockRepo()
		const { port1, port2 } = new MessageChannel()

		exposeRepoOn(repo, port1)
		const _repo = connectToRepo(port2)

		expect(await repo.getFirstCommitHash()).toEqual(await _repo.getFirstCommitHash())

		expect(1).toBe(1)
	})

	it("can get the current branch", async () => {
		const repo = await mockRepo()
		const { port1, port2 } = new MessageChannel()

		exposeRepoOn(repo, port1)
		const _repo = connectToRepo(port2)

		await sleep(100)
		const expectedBranch = await repo.getCurrentBranch()
		await expect(_repo.getCurrentBranch()).resolves.toEqual(expectedBranch)
	})

	it("can read and write files", async () => {
		const repo = await mockRepo()
		const { port1, port2 } = new MessageChannel()

		exposeRepoOn(repo, port1)
		const _repo = connectToRepo(port2)

		_repo.nodeishFs.writeFile("/test.txt", "hello")
		const content = await _repo.nodeishFs.readFile("/test.txt", { encoding: "utf-8" })
		expect(content).toBe("hello")
	})

	it("can watch over rpc", async () => {
		const repo = await mockRepo()
		const { port1, port2 } = new MessageChannel()

		exposeRepoOn(repo, port1)
		const _repo = connectToRepo(port2)

		async function startWatching(path: string, signal: AbortSignal) {
			const updates = []

			const watcher = _repo.nodeishFs.watch(path, { signal })
			expect(Symbol.asyncIterator in watcher).toBe(true)

			try {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				for await (const ev of watcher) {
					const newContent = await _repo.nodeishFs.readFile("/test.txt", { encoding: "utf-8" })
					updates.push(newContent)
				}

				return updates
			} catch (err: unknown) {
				return updates
			}
		}

		const ac = new AbortController()

		const watcherPromise = startWatching("/test.txt", ac.signal)
		await sleep(50)

		await repo.nodeishFs.writeFile("/test.txt", "update 1")
		await sleep(50)

		await repo.nodeishFs.writeFile("/test.txt", "update 2")
		await sleep(50)

		ac.abort()
		await sleep(50)

		await repo.nodeishFs.writeFile("/test.txt", "update after abort")
		await sleep(50)

		const updates = await watcherPromise
		expect(updates).toEqual(["update 1", "update 2"])
	})
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
