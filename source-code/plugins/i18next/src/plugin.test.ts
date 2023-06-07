import { mockEnvironment } from "@inlang/core/test"
import { expect, it } from "vitest"
import { plugin } from "./plugin.js"

it("should throw if the path pattern does not include the {language} placeholder", async () => {
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", "{}")
	const x = plugin({ pathPattern: "./resources/" })(env)
	try {
		await x.config({})
		throw new Error("should not reach this")
	} catch (e) {
		expect((e as Error).message).toContain("pathPattern")
	}
})

it("should not throw if the path pattern is valid", async () => {
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", "{}")
	const x = plugin({ pathPattern: "./{language}.json" })(env)
	expect(await x.config({})).toBeTruthy()
})
