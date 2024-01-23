import { describe, it, expect, vi } from "vitest"
import { editorCommandAction } from "./editor.js"
import { createNodeishMemoryFs } from "@lix-js/fs"

describe("open editor command", () => {
	it("opens the inlang editor url for correct repos", async () => {
		const fs = createNodeishMemoryFs()

		await fs.mkdir("/.git")

		await fs.writeFile(
			"/.git/config",
			`[core]
        repositoryformatversion = 0
        filemode = true
        bare = false
        logallrefupdates = true
        ignorecase = true
        precomposeunicode = true
      [remote "origin"]
        url = git@github.com:inlang/example.git
        fetch = +refs/heads/*:refs/remotes/origin/*
      [branch "main"]
        remote = origin
        merge = refs/heads/main`
		)

		const logger = {
			log: vi.fn(),
			info: vi.fn(),
			error: vi.fn(),
			success: vi.fn(),
		}
		const execMock = vi.fn()

		await editorCommandAction({ exec: execMock, nodeishFs: fs, path: "/", logger })

		expect(logger.error.mock.calls.length).toBe(0)
		expect(execMock.mock.calls.length).toBe(1)
		expect(execMock.mock.calls[0][0]).toMatch(
			/((open)|(start)|(xdg-open)) https:\/\/fink.inlang\.com\/github\.com\/inlang\/example(\/)?/g
		)
	})

	it("displays an error for missing git configuration", async () => {
		const fs = createNodeishMemoryFs()

		const logger = {
			log: vi.fn(),
			info: vi.fn(),
			error: vi.fn(),
			success: vi.fn(),
		}
		const execMock = vi.fn()

		await editorCommandAction({ exec: execMock, nodeishFs: fs, path: "/", logger })

		expect(logger.error.mock.calls.length).toBe(1)
		expect(execMock.mock.calls.length).toBe(0)
	})
})
