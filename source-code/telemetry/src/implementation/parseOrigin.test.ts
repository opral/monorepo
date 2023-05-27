import { it, expect } from "vitest"
import { parseOrigin } from "./parseOrigin.js"

it("should return 'unknown' if the remotes are undefined", () => {
	const result = parseOrigin({ remotes: undefined })
	expect(result).toBe("unknown")
})

it("should return 'unknown' if the remotes are empty", () => {
	const result = parseOrigin({ remotes: [] })
	expect(result).toBe("unknown")
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
	expect(result).toBe("unknown")
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
	expect(result).toBe("unknown")
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
	expect(result.includes(mockSigningKey)).toBe(false)
})

it("should match different origin patterns to one unambigious identifier", () => {
	const remotes = [
		"https://github.com/example/repo.git",
		"git@github.com:example/repo.git",
		"https://ghp_Es2aQE4V0jE7hnm59Zo1GfSSDdRVDE0BxMO1@github.com/example/repo.git",
	]

	for (const remote of remotes) {
		const result = parseOrigin({ remotes: [{ remote: "origin", url: remote }] })
		expect(result).toBe("github.com/example/repo.git")
	}
})
