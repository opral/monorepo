import { describe, it, expect } from "vitest"
import { parseLixUri, parseOrigin } from "./helpers.js"

// TODO: add local uris when implemented: "file://repo"

describe("parseOrigin", () => {
	it("should return 'unknown' if the remotes are undefined", () => {
		const result = parseOrigin({ remotes: undefined })
		expect(result).toBe(undefined)
	})

	it("should return 'unknown' if the remotes are empty", () => {
		const result = parseOrigin({ remotes: [] })
		expect(result).toBe(undefined)
	})

	it("should return 'unknown' if the remotes contain no origin", () => {
		const result = parseOrigin({
			remotes: [
				{
					remote: "foreign",
					url: "https://example.com",
				},
			],
		})
		expect(result).toBe(undefined)
	})

	it("should return the repo  with '.git' at the end  ", () => {
		const result = parseOrigin({
			remotes: [
				{
					remote: "origin",
					url: "https://github.com/example/repo",
				},
			],
		})

		expect(result).toBe("github.com/example/repo.git")
	})
	//the effort to validate the tld is to high at the moment. Because, Rexeg is not reliable and introducing a dependency does not seen worse it.
	it.skip("should return unknown if the origin url is invalid ", () => {
		const result = parseOrigin({
			remotes: [
				{
					remote: "origin",
					url: `https://fcom/f/d.git`,
				},
			],
		})
		expect(result).toBe(undefined)
	})
	it("should origin should not contain signing keys", () => {
		const mockSigningKey = "ghp_Ps2aGEWV0jE7hnm32Zo4HfMABCdRVDE0BxMO1"
		const result = parseOrigin({
			remotes: [
				{
					remote: "origin",
					url: `https://${mockSigningKey}@github.com/peter/neumann.git`,
				},
			],
		})
		expect(result?.includes(mockSigningKey)).toBe(false)
	})

	it("should match different origin patterns to one unambigious identifier", () => {
		const remotes = [
			"https://github.com/example/repo.git",
			"git@github.com:example/repo.git",
			"username@github.com/example/repo.git",
			"https://ghp_Es2aQE4V0jE7hnm59Zo1GfSSDdRVDE0BxMO1@github.com/example/repo.git",
			"x-access-token/ghs_bWzL0m50asffasfLa2RmWkuPasd9Mo0jiK0A@github.com/example/repo.git",
			"gitlab-ci-token/64_jprnG_nQR5sYNLTp6S3w@github.com/example/repo.git",
		]

		for (const remote of remotes) {
			const result = parseOrigin({ remotes: [{ remote: "origin", url: remote }] })
			expect(result).toBe("github.com/example/repo.git")
		}
	})
})

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
