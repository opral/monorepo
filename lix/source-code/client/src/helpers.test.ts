import { describe, it, expect } from "vitest"
import { parseLixUri } from "./helpers.js"

// TODO: add local uris when implemented: "file://repo"

describe("parse lix uris", () => {
	it("parses github uris correctly", () => {
		const parseResult = parseLixUri("https://github.com/opral/monorepo")

		expect(parseResult).toStrictEqual({
			password: "",
			username: "",
			protocol: "https:",
			lixHost: "",
			namespace: "",
			repoHost: "github.com",
			owner: "opral",
			repoName: "monorepo",
		})
	})

	it("parses lix uris correctly", () => {
		const parseResult = parseLixUri("https://lix.inlang.com/git/github.com/opral/monorepo")

		expect(parseResult).toStrictEqual({
			password: "",
			username: "",
			protocol: "https:",
			lixHost: "lix.inlang.com",
			namespace: "git",
			repoHost: "github.com",
			owner: "opral",
			repoName: "monorepo",
		})
	})

	it("parses lix localhost uris correctly", () => {
		const parseResult = parseLixUri("http://localhost:3001/git/github.com/opral/monorepo")

		expect(parseResult).toStrictEqual({
			password: "",
			username: "",
			protocol: "http:",
			lixHost: "localhost:3001",
			namespace: "git",
			repoHost: "github.com",
			owner: "opral",
			repoName: "monorepo",
		})
	})

	it("returns error on missing protocol in uri", () => {
		expect(parseLixUri("lix.inlang.com/git/github.com/opral/monorepo")).toStrictEqual({
			error: new TypeError("Invalid URL"),
			password: "",
			username: "",
			protocol: "",
			lixHost: "",
			namespace: "",
			repoHost: "",
			owner: "",
			repoName: "",
		})
	})

	it("returns error on missing repo name in lix server uri", () => {
		expect(parseLixUri("https://lix.inlang.com/git/github.com/inlang")).toStrictEqual({
			error: new Error(
				`Invalid url format for 'https://lix.inlang.com/git/github.com/inlang' for cloning repository, please use the format of https://lix.inlang.com/git/github.com/opral/monorepo.`
			),
			password: "",
			username: "",
			protocol: "https:",
			lixHost: "lix.inlang.com",
			namespace: "git",
			repoHost: "github.com",
			owner: "inlang",
			repoName: "",
		})
	})

	it("returns error on missing repo name in direct github uri", () => {
		expect(parseLixUri("https://github.com/inlang/")).toStrictEqual({
			error: new Error(
				`Invalid url format for 'https://github.com/inlang/' for direct cloning repository from github, please use the format of https://github.com/opral/monorepo.`
			),
			password: "",
			username: "",
			protocol: "https:",
			lixHost: "",
			namespace: "",
			repoHost: "github.com",
			owner: "inlang",
			repoName: "",
		})
	})
})
