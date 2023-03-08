import { describe, expect, test } from "vitest"
import { createContext, LintedResource, parseLintConfigArguments } from "./context.js"

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

describe("createContext", async () => {
	const context = createContext("rule.id", "error")
	const message = "Something is wrong"

	describe("report", async () => {
		describe("node", async () => {
			test("should not throw if no node gets passed to 'report'", async () => {
				const node = undefined as unknown as LintedResource

				expect(() => context.report({ node, message })).not.toThrow()

				expect(node).toBeUndefined()
			})

			test("should create a `lint` property on the node if not present yet", async () => {
				const node = {} as LintedResource

				context.report({ node, message })

				expect(node.lint).toBeDefined()
				expect(node.lint).toHaveLength(1)
			})

			test("should attach to the `lint` property on the node if present", async () => {
				const node = { lint: [{}] } as LintedResource
				expect(node.lint).toHaveLength(1)

				context.report({ node, message })

				expect(node.lint).toHaveLength(2)
			})
		})

		describe("payload", async () => {
			test("should set the passed `id`", async () => {
				const node = {} as LintedResource

				context.report({ node, message })

				expect(node.lint?.[0].id).toBe("rule.id")
			})

			test("should set the passed `level`", async () => {
				const node = {} as LintedResource

				context.report({ node, message })

				expect(node.lint?.[0].level).toBe("error")
			})

			test("should set the passed `message`", async () => {
				const node = {} as LintedResource

				context.report({ node, message })

				expect(node.lint?.[0].message).toBe(message)
			})

			test("should not set `metadata` if nothing get's passed", async () => {
				const node = {} as LintedResource

				context.report({ node, message })

				expect(node.lint?.[0].metadata).toBeUndefined()
			})

			test("should set the passed `metadata`", async () => {
				const node = {} as LintedResource

				const metadata = {
					custom: true,
					name: "John",
				}

				context.report({ node, message, metadata })

				expect(node.lint?.[0].metadata).toMatchObject(metadata)
			})
		})
	})
})
