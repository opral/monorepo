import { describe, it, expect } from "vitest"
import { parseLixUri } from "./helpers.js"

// TODO: add local uris when implemented: "file://repo"

describe("parse lix uris", () => {
	it("parses github uris correctly", () => {
		const parseResult = parseLixUri("https://github.com/inlang/monorepo")

		expect(parseResult).toStrictEqual({
			protocol: "https:",
			lixHost: "",
			namespace: "",
			repoHost: "github.com",
			owner: "inlang",
			repoName: "monorepo",
		})
	})

	it("parses lix uris correctly", () => {
		const parseResult = parseLixUri("https://lix.inlang.com/git/github.com/inlang/monorepo")

		expect(parseResult).toStrictEqual({
			protocol: "https:",
			lixHost: "lix.inlang.com",
			namespace: "git",
			repoHost: "github.com",
			owner: "inlang",
			repoName: "monorepo",
		})
	})

	it("parses lix localhost uris correctly", () => {
		const parseResult = parseLixUri("http://localhost:3001/git/github.com/inlang/monorepo")

		expect(parseResult).toStrictEqual({
			protocol: "http:",
			lixHost: "localhost:3001",
			namespace: "git",
			repoHost: "github.com",
			owner: "inlang",
			repoName: "monorepo",
		})
	})

	it("throws on misformated uri", () => {
		expect(() => parseLixUri("lix.inlang.com/git/github.com/inlang/monorepo")).toThrowError()

		expect(() => parseLixUri("https://lix.inlang.com/git/github.com/inlang")).toThrowError()

		expect(() => parseLixUri("https://github.com/inlang/")).toThrowError()
	})
})
