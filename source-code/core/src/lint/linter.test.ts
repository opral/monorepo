import { beforeEach, describe, expect, MockContext, test, vi } from "vitest"
import type { Message, Resource } from "../ast/schema.js"
import type { Context } from "./context.js"
import { lint } from "./linter.js"
import { LintRule, createLintRule, EnterNodeFunction, LintableNode } from "./rule.js"

vi.spyOn(console, "info").mockImplementation(vi.fn)
vi.spyOn(console, "warn").mockImplementation(vi.fn)
vi.spyOn(console, "error").mockImplementation(vi.fn)

const doLint = (rules: LintRule[], resources: Resource[]) => {
	const config = {
		referenceLanguage: resources[0]?.languageTag.name,
		languages: resources.map((resource) => resource.languageTag.name),
		lint: { rules },
	}
	return lint({ config, resources })
}

const createResource = (language: string, ...messages: Message[]) =>
	({
		type: "Resource",
		languageTag: {
			type: "LanguageTag",
			name: language,
		},
		body: messages,
	} satisfies Resource)

const createMessage = (id: string, pattern: string) =>
	({
		type: "Message",
		id: { type: "Identifier", name: id },
		pattern: {
			type: "Pattern",
			elements: [{ type: "Text", value: pattern }],
		},
	} satisfies Message)

// --------------------------------------------------------------------------------------------------------------------

const errorRule = {
	id: "error.rule",
	level: "error",
	setup: vi.fn(),
	visitors: {
		Pattern: vi.fn(),
	},
} satisfies LintRule

const warnRule = {
	id: "warn.rule",
	level: "warn",
	setup: vi.fn(),
	visitors: {
		Pattern: vi.fn(),
	},
} satisfies LintRule

const disabledRule = {
	id: "disabled.rule",
	level: false,
	setup: vi.fn(),
	visitors: {
		Pattern: vi.fn(),
	},
} satisfies LintRule

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
		let context: Context
		const result = await doLint(
			[
				{
					id: "inlang.someError",
					level: "error",
					setup: (args) => {
						context = args.context
					},
					visitors: {
						Resource: ({ target }) => {
							if (target) {
								context.report({ node: target, message: "Error" })
							}
						},
					},
				},
			],
			[cloned],
		)
		expect(cloned).toStrictEqual(referenceResource)
		expect(result).not.toStrictEqual(cloned)
	})

	describe("rules", async () => {
		test("should be able to disable rule", async () => {
			const resources = [referenceResource]
			const result = await doLint([disabledRule], resources)

			expect(result).toMatchObject(resources)
			expect(disabledRule.visitors.Pattern).toHaveBeenCalledTimes(0)
		})

		test("should be able to override lint type", async () => {
			const rule = createLintRule("error.rule", "error", () => {
				let context: Context

				return {
					setup: (param) => (context = param.context),
					visitors: {
						Pattern: ({ target }) => context.report({ node: target!, message: "Test" }),
					},
				}
			})

			const resources = [referenceResource]
			const result = await doLint([rule("warn")], resources)
			expect(result?.[0].body[0].pattern.lint?.[0]).toMatchObject({
				id: "error.rule",
				level: "warn",
				message: "Test",
			})
		})

		test("should return the original resource if no rules are specified", async () => {
			const resources = [referenceResource]

			const result = await doLint([], resources)

			expect(result).toEqual(resources)
		})

		test("should process all 'Resources'", async () => {
			const resources = [referenceResource, targetResource]
			const result = await doLint([errorRule], resources)

			expect(result).toMatchObject(resources)
			expect(errorRule.visitors.Pattern).toHaveBeenCalledTimes(2)
		})

		test("should process all 'Resources' for all rules", async () => {
			const resources = [referenceResource, targetResource]
			const result = await doLint([errorRule, warnRule], resources)

			expect(result).toMatchObject(resources)
			expect(errorRule.visitors.Pattern).toHaveBeenCalledTimes(2)
			expect(warnRule.visitors.Pattern).toHaveBeenCalledTimes(2)
		})
	})

	// -----------------------------------------------------------------------------------------------------------------

	describe("visitors", () => {
		const onEnter = vi.fn()
		const onLeave = vi.fn()

		const rule = {
			id: "lint.rule",
			level: "error",
			setup: () => Promise.resolve(console.info("setup")),
			visitors: {
				Resource: {
					enter: ({ target }) => {
						onEnter(target)
						return Promise.resolve(console.info("Resource enter"))
					},
					leave: ({ target }) => {
						onLeave(target)
						return Promise.resolve(console.info("Resource leave"))
					},
				},
				Message: {
					enter: ({ target }) => {
						onEnter(target)
						return Promise.resolve(console.info("Message enter"))
					},
					leave: ({ target }) => {
						onLeave(target)
						return Promise.resolve(console.info("Message leave"))
					},
				},
				Pattern: {
					enter: ({ target }) => {
						onEnter(target)
						return Promise.resolve(console.info("Pattern enter"))
					},
					leave: ({ target }) => {
						onLeave(target)
						return Promise.resolve(console.info("Pattern leave"))
					},
				},
			},
			teardown: () => Promise.resolve(console.info("teardown")),
		} satisfies LintRule

		test("should visit all nodes exactly once", async () => {
			await doLint([rule], [referenceResource])

			expect(onEnter).toHaveBeenCalledTimes(3)
			const onEnterCalls = (onEnter as unknown as MockContext<Array<unknown>, unknown>).calls
			expect(onEnterCalls[0][0]).toMatchObject({ type: "Resource" })
			expect(onEnterCalls[1][0]).toMatchObject({ type: "Message" })
			expect(onEnterCalls[2][0]).toMatchObject({ type: "Pattern" })

			expect(onLeave).toHaveBeenCalledTimes(3)
			const onLeaveCalls = (onLeave as unknown as MockContext<Array<unknown>, unknown>).calls
			expect(onLeaveCalls[0][0]).toMatchObject({ type: "Pattern" })
			expect(onLeaveCalls[1][0]).toMatchObject({ type: "Message" })
			expect(onLeaveCalls[2][0]).toMatchObject({ type: "Resource" })
		})

		test("should visit all Message nodes from reference if not present in target", async () => {
			await doLint(
				[rule],
				[referenceResource, createResource("de", createMessage("second-message", "Test"))],
			)

			expect(onEnter).toHaveBeenCalledTimes(8)
			const calls = (onEnter as unknown as MockContext<Array<unknown>, unknown>).calls

			expect(calls[6][0]).toBeUndefined()
			expect(calls[7][0]).toBeUndefined()
		})

		test("should await all functions", async () => {
			await doLint([rule], [referenceResource])

			expect(console.info).toHaveBeenNthCalledWith(1, "setup")
			expect(console.info).toHaveBeenNthCalledWith(2, "Resource enter")
			expect(console.info).toHaveBeenNthCalledWith(3, "Message enter")
			expect(console.info).toHaveBeenNthCalledWith(4, "Pattern enter")
			expect(console.info).toHaveBeenNthCalledWith(5, "Pattern leave")
			expect(console.info).toHaveBeenNthCalledWith(6, "Message leave")
			expect(console.info).toHaveBeenNthCalledWith(7, "Resource leave")
			expect(console.info).toHaveBeenNthCalledWith(8, "teardown")
		})

		describe("should skip processing children", async () => {
			describe("if no visitor is specified", async () => {
				describe("for 'Resource'", async () => {
					test("node", async () => {
						const modifiedRule = {
							...rule,
							visitors: {},
						} as LintRule

						await doLint([modifiedRule], [referenceResource])

						expect(console.info).toHaveBeenNthCalledWith(1, "setup")
						expect(console.info).toHaveBeenNthCalledWith(2, "teardown")
					})

					describe("but not if children has visitor specified", async () => {
						test("for Message", async () => {
							const modifiedRule = {
								...rule,
								visitors: { Message: rule.visitors.Message.enter },
							} as LintRule

							await doLint([modifiedRule], [referenceResource])

							expect(console.info).toHaveBeenNthCalledWith(1, "setup")
							expect(console.info).toHaveBeenNthCalledWith(2, "Message enter")
							expect(console.info).toHaveBeenNthCalledWith(3, "teardown")
						})

						test("for Pattern", async () => {
							const modifiedRule = {
								...rule,
								visitors: { Pattern: rule.visitors.Pattern.enter },
							} as LintRule

							await doLint([modifiedRule], [referenceResource])

							expect(console.info).toHaveBeenNthCalledWith(1, "setup")
							expect(console.info).toHaveBeenNthCalledWith(2, "Pattern enter")
							expect(console.info).toHaveBeenNthCalledWith(3, "teardown")
						})
					})
				})

				describe("for Message", async () => {
					test("node", async () => {
						const modifiedRule = {
							...rule,
							visitors: { Resource: rule.visitors.Resource.enter },
						} as LintRule

						await doLint([modifiedRule], [referenceResource])

						expect(console.info).toHaveBeenNthCalledWith(1, "setup")
						expect(console.info).toHaveBeenNthCalledWith(2, "Resource enter")
						expect(console.info).toHaveBeenNthCalledWith(3, "teardown")
					})

					describe("but not if children has visitor specified", async () => {
						test("for Pattern", async () => {
							const modifiedRule = {
								...rule,
								visitors: { Pattern: rule.visitors.Pattern.enter },
							} as LintRule

							await doLint([modifiedRule], [referenceResource])

							expect(console.info).toHaveBeenNthCalledWith(1, "setup")
							expect(console.info).toHaveBeenNthCalledWith(2, "Pattern enter")
							expect(console.info).toHaveBeenNthCalledWith(3, "teardown")
						})
					})
				})

				describe("for Pattern", async () => {
					test("node", async () => {
						const modifiedRule = {
							...rule,
							visitors: { Message: rule.visitors.Message.enter },
						} as LintRule

						await doLint([modifiedRule], [referenceResource])

						expect(console.info).toHaveBeenNthCalledWith(1, "setup")
						expect(console.info).toHaveBeenNthCalledWith(2, "Message enter")
						expect(console.info).toHaveBeenNthCalledWith(3, "teardown")
					})
				})
			})

			describe("if 'skip' get's returned by a visitor", async () => {
				test("for 'Resource'", async () => {
					const modifiedRule = {
						...rule,
						visitors: {
							Resource: {
								enter: (...param) => {
									rule.visitors.Resource.enter(...param)
									return "skip"
								},
								leave: rule.visitors.Resource.leave,
							},
							Message: rule.visitors.Message.enter,
							Pattern: rule.visitors.Pattern.enter,
						},
					} as LintRule

					await doLint([modifiedRule], [referenceResource])

					expect(console.info).toHaveBeenNthCalledWith(1, "setup")
					expect(console.info).toHaveBeenNthCalledWith(2, "Resource enter")
					expect(console.info).toHaveBeenNthCalledWith(3, "teardown")
				})

				test("for 'Message'", async () => {
					const modifiedRule = {
						...rule,
						visitors: {
							Message: {
								enter: (...param) => {
									rule.visitors.Message.enter(...param)
									return "skip"
								},
								leave: rule.visitors.Message.leave,
							},
							Pattern: rule.visitors.Pattern.enter,
						},
					} as LintRule

					await doLint([modifiedRule], [referenceResource])

					expect(console.info).toHaveBeenNthCalledWith(1, "setup")
					expect(console.info).toHaveBeenNthCalledWith(2, "Message enter")
					expect(console.info).toHaveBeenNthCalledWith(3, "teardown")
				})

				test("for 'Pattern'", async () => {
					const modifiedRule = {
						...rule,
						visitors: {
							Pattern: {
								enter: (...param) => {
									rule.visitors.Pattern.enter(...param)
									return "skip"
								},
								leave: rule.visitors.Pattern.leave,
							},
						},
					} as LintRule

					await doLint([modifiedRule], [referenceResource])

					expect(console.info).toHaveBeenNthCalledWith(1, "setup")
					expect(console.info).toHaveBeenNthCalledWith(2, "Pattern enter")
					expect(console.info).toHaveBeenNthCalledWith(3, "teardown")
				})
			})
		})
	})

	// -----------------------------------------------------------------------------------------------------------------

	describe("exceptions", async () => {
		const rule = {
			id: "lint.rule",
			level: "error",
			setup: vi.fn(),
			visitors: {},
		} as LintRule

		describe("should not kill process", async () => {
			test("if 'teardown' is not present", async () => {
				expect(doLint([rule], [referenceResource])).resolves.not.toThrow()
			})

			describe("for 'Resource'", async () => {
				test("if not present", async () => {
					const modifiedRule = {
						...rule,
						visitors: { Message: vi.fn(), Pattern: vi.fn() },
					} as LintRule

					expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
				})

				test("if 'enter' is not present", async () => {
					const modifiedRule = {
						...rule,
						visitors: { Resource: { leave: vi.fn() } },
					} as LintRule

					expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
				})

				test("if 'leave' is not present", async () => {
					const modifiedRule = {
						...rule,
						visitors: { Resource: { enter: vi.fn() } },
					} as LintRule

					expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
				})
			})

			describe("for 'Message'", async () => {
				test("if not present", async () => {
					const modifiedRule = {
						...rule,
						visitors: { Resource: vi.fn(), Pattern: vi.fn() },
					} as LintRule

					expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
				})

				test("if 'enter' is not present", async () => {
					const modifiedRule = {
						...rule,
						visitors: { Message: { leave: vi.fn() } },
					} as LintRule

					expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
				})

				test("if 'leave' is not present", async () => {
					const modifiedRule = {
						...rule,
						visitors: { Message: { enter: vi.fn() } },
					} as LintRule

					expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
				})
			})

			describe("for 'Pattern'", async () => {
				test("if not present", async () => {
					const modifiedRule = {
						...rule,
						visitors: { Resource: vi.fn(), Message: vi.fn() },
					} as LintRule

					expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
				})

				test("if 'enter' is not present", async () => {
					const modifiedRule = {
						...rule,
						visitors: { Pattern: { leave: vi.fn() } },
					} as LintRule

					expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
				})

				test("if 'leave' is not present", async () => {
					const modifiedRule = {
						...rule,
						visitors: { Pattern: { enter: vi.fn() } },
					} as LintRule

					expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
				})
			})

			describe("if visitor throws", async () => {
				describe("in 'Resource'", async () => {
					test("'enter'", async () => {
						const modifiedRule = {
							...rule,
							visitors: {
								Resource: {
									enter: () => {
										throw new Error()
									},
								},
							},
						} as LintRule

						await expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
						expect(console.error).toHaveBeenCalledTimes(1)
					})

					test("'leave'", async () => {
						const modifiedRule = {
							...rule,
							visitors: {
								Resource: {
									leave: () => {
										throw new Error()
									},
								},
							},
						} as LintRule

						await expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
						expect(console.error).toHaveBeenCalledTimes(1)
					})
				})

				describe("in 'Message'", async () => {
					test("'enter'", async () => {
						const modifiedRule = {
							...rule,
							visitors: {
								Message: {
									enter: () => {
										throw new Error()
									},
								},
							},
						} as LintRule

						await expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
						expect(console.error).toHaveBeenCalledTimes(1)
					})

					test("'leave'", async () => {
						const modifiedRule = {
							...rule,
							visitors: {
								Message: {
									leave: () => {
										throw new Error()
									},
								},
							},
						} as LintRule

						await expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
						expect(console.error).toHaveBeenCalledTimes(1)
					})
				})

				describe("in 'Pattern'", async () => {
					test("'enter'", async () => {
						const modifiedRule = {
							...rule,
							visitors: {
								Pattern: {
									enter: () => {
										throw new Error()
									},
								},
							},
						} as LintRule

						await expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
						expect(console.error).toHaveBeenCalledTimes(1)
					})

					test("'leave'", async () => {
						const modifiedRule = {
							...rule,
							visitors: {
								Pattern: {
									leave: () => {
										throw new Error()
									},
								},
							},
						} as LintRule

						await expect(doLint([modifiedRule], [referenceResource])).resolves.not.toThrow()
						expect(console.error).toHaveBeenCalledTimes(1)
					})
				})
			})
		})
	})

	// -----------------------------------------------------------------------------------------------------------------

	describe("payloads", async () => {
		const onEnter = vi.fn()
		const onLeave = vi.fn()

		const rule = {
			id: "lint.rule",
			level: "error",
			setup: (param) => {
				onEnter(param)
				return { setup: true }
			},
			visitors: {
				Resource: {
					enter: ({ payload }) => {
						onEnter(payload)
						return { ...payload, resource: true }
					},
					leave: ({ payload }) => {
						onLeave(payload)
					},
				},
				Message: {
					enter: ({ payload }) => {
						onEnter(payload)
						return { ...payload, message: true }
					},
					leave: ({ payload }) => {
						onLeave(payload)
					},
				},
				Pattern: {
					enter: ({ payload }) => {
						onEnter(payload)
						return { ...payload, pattern: true }
					},
					leave: ({ payload }) => {
						onLeave(payload)
					},
				},
			},
			teardown: ({ payload }) => {
				onLeave(payload)
			},
		} satisfies LintRule

		describe("should receive the payload", async () => {
			test("in 'setup", async () => {
				await doLint([rule], [referenceResource])

				const payload = (onEnter as unknown as MockContext<Array<unknown>, unknown>)
					.calls[0][0] as Parameters<LintRule["setup"]>[0]
				expect(payload.referenceLanguage).toBe("en")
				expect(payload.languages).toMatchObject(["en"])
				expect(payload.context.report).toBeDefined()
			})

			describe("in 'Resource'", async () => {
				describe("enter", async () => {
					test("from the 'setup' function", async () => {
						await doLint([rule], [referenceResource])

						const payload = (onEnter as unknown as MockContext<Array<unknown>, unknown>)
							.calls[1][0] as Parameters<EnterNodeFunction<LintableNode, unknown, unknown>>[0]
						expect(payload).toMatchObject({
							setup: true,
						})
					})

					test("'undefined' if no payload returned from 'setup'", async () => {
						const modifiedRule = {
							...rule,
							setup: vi.fn(),
						} as LintRule
						await doLint([modifiedRule], [referenceResource])

						const payload = (onEnter as unknown as MockContext<Array<unknown>, unknown>)
							.calls[0][0] as Parameters<EnterNodeFunction<LintableNode, unknown, unknown>>[0]
						expect(payload).toBeUndefined()
					})
				})

				describe("leave", async () => {
					test("from the 'enter' function", async () => {
						await doLint([rule], [referenceResource])
						const payload = (onLeave as unknown as MockContext<Array<unknown>, unknown>)
							.calls[2][0] as Parameters<EnterNodeFunction<LintableNode, unknown, unknown>>[0]
						expect(payload).toMatchObject({
							setup: true,
							resource: true,
						})
					})

					test("from the 'setup' function if no payload returned from 'enter'", async () => {
						const modifiedRule = {
							...rule,
							visitors: {
								...rule.visitors,
								Resource: { ...rule.visitors.Resource, enter: vi.fn() },
							},
						} as LintRule
						await doLint([modifiedRule], [referenceResource])

						const payload = (onLeave as unknown as MockContext<Array<unknown>, unknown>)
							.calls[2][0] as Parameters<EnterNodeFunction<LintableNode, unknown, unknown>>[0]
						expect(payload).toMatchObject({
							setup: true,
						})
					})
				})
			})

			describe("in 'Message'", async () => {
				describe("enter", async () => {
					test("from the 'setup' function", async () => {
						await doLint([rule], [referenceResource])

						const payload = (onEnter as unknown as MockContext<Array<unknown>, unknown>)
							.calls[2][0] as Parameters<EnterNodeFunction<LintableNode, unknown, unknown>>[0]
						expect(payload).toMatchObject({
							setup: true,
							resource: true,
						})
					})

					test("from the 'setup' function if no payload returned from 'Resource'", async () => {
						const modifiedRule = {
							...rule,
							visitors: {
								...rule.visitors,
								Resource: { ...rule.visitors.Resource, enter: vi.fn() },
							},
						} as LintRule
						await doLint([modifiedRule], [referenceResource])

						const payload = (onEnter as unknown as MockContext<Array<unknown>, unknown>)
							.calls[1][0] as Parameters<EnterNodeFunction<LintableNode, unknown, unknown>>[0]
						expect(payload).toMatchObject({
							setup: true,
						})
					})
				})

				describe("leave", async () => {
					test("from the 'enter' function", async () => {
						await doLint([rule], [referenceResource])
						const payload = (onLeave as unknown as MockContext<Array<unknown>, unknown>)
							.calls[1][0] as Parameters<EnterNodeFunction<LintableNode, unknown, unknown>>[0]
						expect(payload).toMatchObject({
							setup: true,
							resource: true,
							message: true,
						})
					})

					test("from the 'setup' function if no payload returned from 'enter'", async () => {
						const modifiedRule = {
							...rule,
							visitors: {
								...rule.visitors,
								Message: { ...rule.visitors.Message, enter: vi.fn() },
							},
						} as LintRule
						await doLint([modifiedRule], [referenceResource])

						const payload = (onLeave as unknown as MockContext<Array<unknown>, unknown>)
							.calls[1][0] as Parameters<EnterNodeFunction<LintableNode, unknown, unknown>>[0]
						expect(payload).toMatchObject({
							setup: true,
							resource: true,
						})
					})
				})
			})

			describe("in 'Pattern'", async () => {
				describe("enter", async () => {
					test("from the 'setup' function", async () => {
						await doLint([rule], [referenceResource])

						const payload = (onEnter as unknown as MockContext<Array<unknown>, unknown>)
							.calls[3][0] as Parameters<EnterNodeFunction<LintableNode, unknown, unknown>>[0]
						expect(payload).toMatchObject({
							setup: true,
							resource: true,
							message: true,
						})
					})

					test("from the 'Resource' function if no payload returned from 'Message'", async () => {
						const modifiedRule = {
							...rule,
							visitors: {
								...rule.visitors,
								Message: { ...rule.visitors.Message, enter: vi.fn() },
							},
						} as LintRule
						await doLint([modifiedRule], [referenceResource])

						const payload = (onEnter as unknown as MockContext<Array<unknown>, unknown>)
							.calls[2][0] as Parameters<EnterNodeFunction<LintableNode, unknown, unknown>>[0]
						expect(payload).toMatchObject({
							setup: true,
							resource: true,
						})
					})
				})

				describe("leave", async () => {
					test("from the 'enter' function", async () => {
						await doLint([rule], [referenceResource])
						const payload = (onLeave as unknown as MockContext<Array<unknown>, unknown>)
							.calls[0][0] as Parameters<EnterNodeFunction<LintableNode, unknown, unknown>>[0]
						expect(payload).toMatchObject({
							setup: true,
							resource: true,
							message: true,
							pattern: true,
						})
					})

					test("from the 'Message' function if no payload returned from 'enter'", async () => {
						const modifiedRule = {
							...rule,
							visitors: {
								...rule.visitors,
								Pattern: { ...rule.visitors.Pattern, enter: vi.fn() },
							},
						} as LintRule
						await doLint([modifiedRule], [referenceResource])

						const payload = (onLeave as unknown as MockContext<Array<unknown>, unknown>)
							.calls[0][0] as Parameters<EnterNodeFunction<LintableNode, unknown, unknown>>[0]
						expect(payload).toMatchObject({
							setup: true,
							resource: true,
							message: true,
						})
					})
				})
			})

			describe("in 'teardown'", async () => {
				test("from the 'setup' function", async () => {
					await doLint([rule], [referenceResource])

					const payload = (onLeave as unknown as MockContext<Array<unknown>, unknown>)
						.calls[3][0] as Parameters<LintRule["setup"]>[0]
					expect(payload).toMatchObject({
						setup: true,
					})
				})

				test("'undefined' if no payload returned from 'setup'", async () => {
					const modifiedRule = {
						...rule,
						setup: vi.fn(),
					} as LintRule
					await doLint([modifiedRule], [referenceResource])

					const payload = (onLeave as unknown as MockContext<Array<unknown>, unknown>)
						.calls[3][0] as Parameters<LintRule["setup"]>[0]
					expect(payload).toBeUndefined()
				})
			})
		})
	})
})
