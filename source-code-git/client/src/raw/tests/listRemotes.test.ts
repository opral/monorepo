// @ts-nocheck
/* eslint-env node, browser, jasmine */
import { describe, it, expect, beforeAll } from "vitest"
import { makeFixture } from "./makeFixture.js"
import { listRemotes } from "isomorphic-git"

describe("listRemotes", () => {
	it("listRemotes", async () => {
		// Setup
		const { fs, dir, gitdir } = await makeFixture("test-listRemotes")
		// Test
		const a = await listRemotes({ fs, dir, gitdir })
		expect(a).toEqual([
			{ remote: "foo", url: "git@github.com:foo/foo.git" },
			{ remote: "bar", url: "git@github.com:bar/bar.git" },
		])
	})
})
