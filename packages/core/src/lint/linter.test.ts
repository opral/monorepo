import { beforeEach, describe, expect, MockContext, test, vi } from "vitest"
import type { Resource } from "@inlang/core/ast"
import { lint } from "./linter.js"
import type { LintRule } from "./rule.js"
import { createLintRule } from "./createLintRule.js"
import { createMessage, createResource } from '../test/utils.js'

vi.spyOn(console, "info").mockImplementation(vi.fn)
vi.spyOn(console, "warn").mockImplementation(vi.fn)
vi.spyOn(console, "error").mockImplementation(vi.fn)

const doLint = (rules: LintRule[], resources: Resource[]) => {
	const config = {
		// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
		referenceLanguage: resources[0]!.languageTag.name!,
		languages: resources.map((resource) => resource.languageTag.name),
		lint: { rules },
	}
	return lint({ config, resources })
}

// --------------------------------------------------------------------------------------------------------------------

const referenceResource = createResource(
	"en",
	createMessage("first-message", "Welcome to this app."),
)
const targetResource = createResource(
	"de",
	createMessage("first-message", "Willkommen zu dieser Applikation."),
)

// --------------------------------------------------------------------------------------------------------------------

describe("lint", async () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	test("it should be immutable and not modify the resources passed as an argument", async () => {
		const cloned = structuredClone(referenceResource)
		const rule = createLintRule({
			id: "inlang.someError",
			setup: ({ report }) => ({
				visitors: {
					Resource: ({ target }) => {
						if (target) {
							report({ node: target, message: "Error" })
						}
					},
				},
			}),
		})
		const [result] = await doLint([rule("error")], [cloned])
		expect(cloned).toStrictEqual(referenceResource)
		expect(result).not.toStrictEqual(cloned)
	})

	test("it should not abort the linting process when errors occur", async () => {
		const cloned = structuredClone(referenceResource)
		const rule = createLintRule({
			id: "inlang.someError",
			setup: () => ({
				visitors: {
					Resource: ({ target }) => {
						if (target) {
							throw new Error("Error")
						}
					},
				},
			}),
		})
		const [, errors] = await doLint([rule("error")], [cloned])
		expect(errors!.length).toBe(1)
		expect(errors![0]!.message.includes("inlang.someError"))
	})

	describe("rules", async () => {
		const visitorErrorPatternFn = vi.fn()
		const visitorWarnPatternFn = vi.fn()

		const errorRule = {
			id: "error.rule",
			level: "error",
			setup: () => ({
				visitors: {
					Pattern: visitorErrorPatternFn,
				},
			}),
		} satisfies LintRule

		const warnRule = {
			id: "warn.rule",
			level: "warn",
			setup: () => ({
				visitors: {
					Pattern: visitorWarnPatternFn,
				},
			}),
		} satisfies LintRule

		test("should return the original resource if no rules are specified", async () => {
			const resources = [referenceResource]

			const [result] = await doLint([], resources)

			expect(result).toEqual(resources)
		})

		test("should process all 'Resources'", async () => {
			const resources = [referenceResource, targetResource]
			const [result] = await doLint([errorRule], resources)

			expect(result).toMatchObject(resources)
			expect(visitorErrorPatternFn).toHaveBeenCalledTimes(2)
		})

		test("should process all 'Resources' for all rules", async () => {
			const resources = [referenceResource, targetResource]
			const [result] = await doLint([errorRule, warnRule], resources)

			expect(result).toMatchObject(resources)
			expect(visitorErrorPatternFn).toHaveBeenCalledTimes(2)
			expect(visitorWarnPatternFn).toHaveBeenCalledTimes(2)
		})
	})

	// -----------------------------------------------------------------------------------------------------------------

	describe("visitors", () => {
		const onEnter = vi.fn()

		const rule = {
			id: "lint.rule",
			level: "error",
			setup: () => ({
				visitors: {
					Resource: ({ target }) => {
						onEnter(target)
						return Promise.resolve(console.info("Resource enter"))
					},
					Message: ({ target }) => {
						onEnter(target)
						return Promise.resolve(console.info("Message enter"))
					},
					Pattern: ({ target }) => {
						onEnter(target)
						return Promise.resolve(console.info("Pattern enter"))
					},
				},
			}),
		} satisfies LintRule

		test("should visit all nodes exactly once", async () => {
			await doLint([rule], [referenceResource])

			expect(onEnter).toHaveBeenCalledTimes(3)
			const onEnterCalls = (onEnter as unknown as MockContext<Array<unknown>, unknown>).calls
			expect(onEnterCalls[0]![0]).toMatchObject({ type: "Resource" })
			expect(onEnterCalls[1]![0]).toMatchObject({ type: "Message" })
			expect(onEnterCalls[2]![0]).toMatchObject({ type: "Pattern" })
		})

		test("should visit all Message nodes from reference if not present in target", async () => {
			await doLint(
				[rule],
				[referenceResource, createResource("de", createMessage("second-message", "Test"))],
			)

			expect(onEnter).toHaveBeenCalledTimes(8)
			const calls = (onEnter as unknown as MockContext<Array<unknown>, unknown>).calls

			expect(calls[6]![0]).toBeUndefined()
			expect(calls[7]![0]).toBeUndefined()
		})

		test("should visit all Message nodes from target even if not present in reference", async () => {
			const message = createMessage("first-message", "Test")
			const fn = vi.fn()
			await lint({
				config: {
					languages: ["en", "de"],
					referenceLanguage: "en",
					lint: {
						rules: [
							{
								id: "lint.rule",
								level: "error",
								setup: () => ({
									visitors: {
										Message: ({ target }) => {
											fn(target)
										},
									},
								}),
							},
						],
					},
				},
				resources: [createResource("de", message)],
			})

			expect(fn).toHaveBeenCalledTimes(1)
			const calls = (fn as unknown as MockContext<Array<unknown>, unknown>).calls

			expect(calls[0]![0]).toStrictEqual(message)
		})

		test("should await all functions", async () => {
			await doLint([rule], [referenceResource])

			expect(console.info).toHaveBeenNthCalledWith(1, "Resource enter")
			expect(console.info).toHaveBeenNthCalledWith(2, "Message enter")
			expect(console.info).toHaveBeenNthCalledWith(3, "Pattern enter")
		})

		describe("should skip processing children", async () => {
			describe("if no visitor is specified", async () => {
				describe("for 'Resource'", async () => {
					test("node", async () => {
						const modifiedRule = {
							...rule,
							setup: () => ({ visitors: {} }),
						} satisfies LintRule

						await doLint([modifiedRule], [referenceResource])
					})
				})

				describe("but not if children has visitor specified", async () => {
					test("for Message", async () => {
						const modifiedRule: LintRule = {
							id: "lint.rule",
							level: "error",
							setup: () => ({
								visitors: {
									Message: () => {
										console.info("Message enter")
									},
								},
							}),
						}

						await doLint([modifiedRule], [referenceResource])

						expect(console.info).toHaveBeenNthCalledWith(1, "Message enter")
					})

					test("for Pattern", async () => {
						const rule: LintRule = {
							id: "lint.rule",
							level: "error",
							setup: () => ({
								visitors: {
									Pattern: () => {
										console.info("Pattern enter")
									},
								},
							}),
						}

						await doLint([rule], [referenceResource])

						expect(console.info).toHaveBeenNthCalledWith(1, "Pattern enter")
					})
				})
			})

			describe("if 'skip' get's returned by a visitor", async () => {
				test("for 'Resource'", async () => {
					const rule: LintRule = {
						id: "lint.rule",
						level: "error",
						setup: () => ({
							visitors: {
								Resource: () => {
									console.info("Resource enter")
									return "skip"
								},
								Message: () => {
									console.info("Message enter")
								},
							},
						}),
					}
					await doLint([rule], [referenceResource])

					expect(console.info).toHaveBeenNthCalledWith(1, "Resource enter")
				})

				test("for 'Message'", async () => {
					const rule: LintRule = {
						id: "lint.rule",
						level: "error",
						setup: () => ({
							visitors: {
								Message: () => {
									console.info("Message enter")
									return "skip"
								},
								Pattern: () => {
									console.info("Pattern enter")
								},
							},
						}),
					}
					await doLint([rule], [referenceResource])
					expect(console.info).toHaveBeenNthCalledWith(1, "Message enter")
				})

				test("for 'Pattern'", async () => {
					const rule: LintRule = {
						id: "lint.rule",
						level: "error",
						setup: () => ({
							visitors: {
								Pattern: () => {
									console.info("Pattern enter")
									return "skip"
								},
							},
						}),
					}

					await doLint([rule], [referenceResource])

					expect(console.info).toHaveBeenNthCalledWith(1, "Pattern enter")
				})
			})
		})
	})
})
