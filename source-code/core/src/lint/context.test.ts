import { describe, expect, test } from "vitest"
import { parseLintConfigArguments } from "./context.js"

describe("parseLintConfigArguments", async () => {
	test("when `undefined` get's passed", async () => {
		const args = parseLintConfigArguments(undefined, "error")

		expect(args).toMatchObject({
			level: "error",
			settings: undefined,
		})
	})

	test("when an empty Array get's passed", async () => {
		const args = parseLintConfigArguments([], "error")

		expect(args).toMatchObject({
			level: "error",
			settings: undefined,
		})
	})

	test("when `error` get's passed", async () => {
		const args = parseLintConfigArguments(["error"], "warn")

		expect(args).toMatchObject({
			level: "error",
			settings: undefined,
		})
	})

	test("when `warn` get's passed", async () => {
		const args = parseLintConfigArguments(["warn"], "error")

		expect(args).toMatchObject({
			level: "warn",
			settings: undefined,
		})
	})

	test("when `true` get's passed", async () => {
		const args = parseLintConfigArguments([true], "error")

		expect(args).toMatchObject({
			level: "error",
			settings: undefined,
		})
	})

	test("when `false` get's passed", async () => {
		const args = parseLintConfigArguments([false], "error")

		expect(args).toMatchObject({
			level: false,
			settings: undefined,
		})
	})

	test("when custom `settings` get's passed", async () => {
		const settings = {
			custom: true,
			prop: [123, 456],
			nested: {
				prop: "inlang",
			},
		}

		const args = parseLintConfigArguments(["error", settings], "warn")

		expect(args).toMatchObject({
			level: "error",
			settings,
		})
	})
})
