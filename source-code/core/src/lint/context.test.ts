import { describe, expect, test } from "vitest";
import { createContext, LintedResource, parseLintSettings } from './context.js';

describe("parseLintSettings", async () => {
	test("when `undefined` get's passed", async () => {
		const settings = parseLintSettings(undefined, 'error')

		expect(settings).toMatchObject({
			level: 'error',
			options: undefined,
		})
	})

	test("when an empty Array get's passed", async () => {
		const settings = parseLintSettings([], 'error')

		expect(settings).toMatchObject({
			level: 'error',
			options: undefined,
		})
	})

	test("when `error` get's passed", async () => {
		const settings = parseLintSettings(['error'], 'warn')

		expect(settings).toMatchObject({
			level: 'error',
			options: undefined,
		})
	})

	test("when `warn` get's passed", async () => {
		const settings = parseLintSettings(['warn'], 'error')

		expect(settings).toMatchObject({
			level: 'warn',
			options: undefined,
		})
	})

	test("when `true` get's passed", async () => {
		const settings = parseLintSettings([true], 'error')

		expect(settings).toMatchObject({
			level: 'error',
			options: undefined,
		})
	})

	test("when `false` get's passed", async () => {
		const settings = parseLintSettings([false], 'error')

		expect(settings).toMatchObject({
			level: false,
			options: undefined,
		})
	})

	test("when custom `settings` get's passed", async () => {
		const options = {
			custom: true,
			prop: [123, 456],
			nested: {
				prop: 'inlang',
			}
		}

		const settings = parseLintSettings(['error', options], 'warn')

		expect(settings).toMatchObject({
			level: 'error',
			options,
		})
	})
})

describe("createContext", async () => {
	const context = createContext('rule.id', 'error')
	const message = 'Something is wrong'

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

				expect(node.lint?.[0].id).toBe('rule.id')
			})

			test("should set the passed `level`", async () => {
				const node = {} as LintedResource

				context.report({ node, message })

				expect(node.lint?.[0].level).toBe('error')
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
					name: 'John'
				}

				context.report({ node, message, metadata })

				expect(node.lint?.[0].metadata).toMatchObject(metadata)
			})
		})
	})
})
