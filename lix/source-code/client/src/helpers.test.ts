import { describe, it, expect } from "vitest"
import { parseLixUri } from "./helpers.js"

// TODO: add local uris when implemented: "file://repo"

describe("parse lix uris", () => {
	it("parses github uris correctly", () => {
		const parseResult = parseLixUri("https://github.com/inlang/monorepo")

		expect(parseResult).toStrictEqual({
			password: "",
			username: "",
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
			password: "",
			username: "",
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
			password: "",
			username: "",
			protocol: "http:",
			lixHost: "localhost:3001",
			namespace: "git",
			repoHost: "github.com",
			owner: "inlang",
			repoName: "monorepo",
		})
	})

	it("throws on missing protocol in uri", () => {
		expect(() => parseLixUri("lix.inlang.com/git/github.com/inlang/monorepo")).toThrowError()
	})

	it("throws on missing repo name in lix server uri", () => {
		expect(() => parseLixUri("https://lix.inlang.com/git/github.com/inlang")).toThrowError()
	})

	it("throws on missing repo name in direct github uri", () => {
		expect(() => parseLixUri("https://github.com/inlang/")).toThrowError()
	})
})
