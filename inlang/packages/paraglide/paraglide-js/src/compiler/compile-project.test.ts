import { expect, test, describe, vi, beforeEach } from "vitest";
import { AsyncLocalStorage } from "async_hooks";
import {
	createProject as typescriptProject,
	ts,
	type ProjectOptions,
} from "@ts-morph/bootstrap";
import {
	type BundleNested,
	Declaration,
	insertBundleNested,
	loadProjectInMemory,
	type Match,
	newProject,
	Pattern,
	VariableReference,
} from "@inlang/sdk";
import { compileProject } from "./compile-project.js";
import virtual from "@rollup/plugin-virtual";
import { rolldown } from "rolldown";

beforeEach(() => {
	// reset the imports to make sure that the runtime is reloaded
	vi.resetModules();
	vi.clearAllMocks();

	// mocking DOM globals
	// @ts-expect-error - global variable definition
	globalThis.window = undefined;
});

test("emitGitignore", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				locales: ["en", "de"],
				baseLocale: "en",
			},
		}),
	});

	const _default = await compileProject({
		project,
	});

	const _true = await compileProject({
		project,
		compilerOptions: { emitGitIgnore: true },
	});

	const _false = await compileProject({
		project,
		compilerOptions: { emitGitIgnore: false },
	});

	expect(_default).toHaveProperty(".gitignore");
	expect(_true).toHaveProperty(".gitignore");
	expect(_false).not.toHaveProperty(".gitignore");
});

test("emitPrettierIgnore", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				locales: ["en", "de"],
				baseLocale: "en",
			},
		}),
	});

	const _default = await compileProject({
		project,
	});

	const _true = await compileProject({
		project,
		compilerOptions: { emitPrettierIgnore: true },
	});

	const _false = await compileProject({
		project,
		compilerOptions: { emitPrettierIgnore: false },
	});

	expect(_default).toHaveProperty(".prettierignore");
	expect(_true).toHaveProperty(".prettierignore");
	expect(_false).not.toHaveProperty(".prettierignore");
});

test("handles message bundles with a : in the id", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				locales: ["en", "de"],
				baseLocale: "en",
			},
		}),
	});

	await insertBundleNested(
		project.db,
		createBundleNested({
			id: "hello:world",
			messages: [
				{
					locale: "en",
					variants: [{ pattern: [{ type: "text", value: "Hello world!" }] }],
				},
			],
		})
	);

	const output = await compileProject({
		project,
	});

	const code = await bundleCode(
		output,
		`export * as m from "./paraglide/messages.js"
		 export * as runtime from "./paraglide/runtime.js"`
	);

	const { m } = await importCode(code);

	expect(m["hello:world"]()).toBe("Hello world!");
});

// https://github.com/opral/inlang-paraglide-js/issues/347
test("can emit message bundles with more than 255 characters", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: {
				baseLocale: "en",
				locales: ["en", "de"],
			},
		}),
	});

	await insertBundleNested(
		project.db,
		createBundleNested({
			// 300 characters long id
			id: "a".repeat(300),
			messages: [
				{
					locale: "en",
					variants: [
						{
							pattern: [{ type: "text", value: "Hello" }],
						},
					],
				},
			],
		})
	);

	const output = await compileProject({
		project,
		compilerOptions: {
			urlPatterns: [],
		},
	});

	const code = await bundleCode(
		output,
		`export * as m from "./paraglide/messages.js"
		 export * as runtime from "./paraglide/runtime.js"`
	);

	const { m } = await importCode(code);

	expect(m["a".repeat(300)]()).toBe("Hello");
});

describe.each([
	// useTsImports must be true to test emitTs. Otherwise, rolldown can't resolve the imports
	{
		outputStructure: "locale-modules",
		strategy: ["globalVariable", "baseLocale"],
	},
	{
		outputStructure: "message-modules",
		strategy: ["globalVariable", "baseLocale"],
	},
] satisfies Array<Parameters<typeof compileProject>["0"]["compilerOptions"]>)(
	"options",
	async (compilerOptions) => {
		const output = await compileProject({ project, compilerOptions });

		describe("tree-shaking", () => {
			test("should tree-shake unused messages", async () => {
				const code = await bundleCode(
					output,
					`import * as m from "./paraglide/messages.js"

					console.log(m.sad_penguin_bundle())`
				);
				const log = vi.spyOn(console, "log").mockImplementation(() => {});
				// all required code for the message to be rendered is included like sourceLanguageTag.
				// but, all other messages except of 'sad_penguin_bundle' are tree-shaken away.
				for (const { id } of mockBundles) {
					if (id === "sad_penguin_bundle") {
						expect(code).toContain(id);
					} else {
						expect(code).not.toContain(id);
					}
				}
				eval(code);
				expect(log).toHaveBeenCalledWith("A simple message.");
			});

			// https://github.com/opral/inlang-paraglide-js/issues/345
			test("importing { m } works and tree-shakes unused messages", async () => {
				const code = await bundleCode(
					output,
					`import { m } from "./paraglide/messages.js"
					console.log(m.sad_penguin_bundle())`
				);
				const log = vi.spyOn(console, "log").mockImplementation(() => {});

				// all required code for the message to be rendered is included like sourceLanguageTag.
				// but, all other messages except of 'sad_penguin_bundle' are tree-shaken away.
				for (const { id } of mockBundles) {
					if (id === "sad_penguin_bundle") {
						expect(code).toContain(id);
					} else {
						expect(code).not.toContain(id);
					}
				}
				eval(code);
				expect(log).toHaveBeenCalledWith("A simple message.");
			});

			test("should not treeshake messages that are used", async () => {
				const code = await bundleCode(
					output,
					`import * as m from "./paraglide/messages.js"
		
			console.log(
				m.sad_penguin_bundle(),
				m.depressed_dog({ name: "Samuel" }),
				m.insane_cats({ name: "Samuel", count: 5 })
			)`
				);
				const log = vi.spyOn(console, "log").mockImplementation(() => {});
				for (const id of mockBundles.map((m) => m.id)) {
					if (
						["sad_penguin_bundle", "depressed_dog", "insane_cats"].includes(id)
					) {
						expect(code).toContain(id);
					} else {
						expect(code).not.toContain(id);
					}
				}
				eval(code);
				expect(log).toHaveBeenCalledWith(
					"A simple message.",
					"Good morning Samuel!",
					"Hello Samuel! You have 5 messages."
				);
			});
		});

		// https://github.com/opral/inlang-paraglide-js/issues/379
		test("plurals work", async () => {
			const project = await loadProjectInMemory({
				blob: await newProject({
					settings: { locales: ["en", "de"], baseLocale: "en" },
				}),
			});

			await insertBundleNested(
				project.db,
				createBundleNested({
					id: "plural_test",
					declarations: [
						{ type: "input-variable", name: "count" },
						{
							type: "local-variable",
							name: "countPlural",
							value: {
								arg: { type: "variable-reference", name: "count" },
								annotation: {
									type: "function-reference",
									name: "plural",
									options: [],
								},
								type: "expression",
							},
						},
					],
					messages: [
						{
							locale: "en",
							selectors: [{ type: "variable-reference", name: "countPlural" }],
							variants: [
								{
									matches: [
										{ type: "literal-match", value: "one", key: "countPlural" },
									],
									pattern: [{ type: "text", value: "There is one cat." }],
								},
								{
									matches: [
										{
											type: "literal-match",
											value: "other",
											key: "countPlural",
										},
									],
									pattern: [{ type: "text", value: "There are many cats." }],
								},
							],
						},
					],
				})
			);

			const { m } = await importCode(
				await bundleCode(
					await compileProject({
						project,
						compilerOptions,
					}),
					`export * as m from "./paraglide/messages.js"`
				)
			);

			expect(m.plural_test({ count: 1 })).toBe("There is one cat.");
			expect(m.plural_test({ count: 2 })).toBe("There are many cats.");
		});

		describe("e2e", async () => {
			// The compiled output needs to be bundled into one file to be dynamically imported.
			const code = await bundleCode(
				output,
				`export * as m from "./paraglide/messages.js"
		     export * as runtime from "./paraglide/runtime.js"`
			);

			// test is a direct result of a bug
			test("locales should include locales with a hyphen", async () => {
				const { runtime } = await importCode(code);

				expect(runtime.locales).toContain("en-US");
			});

			test("should set the baseLocale as default getLocale value", async () => {
				const { runtime } = await importCode(code);

				expect(runtime.getLocale()).toBe(runtime.baseLocale);
			});

			test("should return the correct message for the current locale", async () => {
				const { m, runtime } = await importCode(code);

				runtime.setLocale("en");

				expect(m.sad_penguin_bundle()).toBe("A simple message.");

				runtime.setLocale("de");

				expect(m.sad_penguin_bundle()).toBe("Eine einfache Nachricht.");
			});

			test("overwriteGetLocale() works", async () => {
				const { m, runtime } = await importCode(code);

				let locale = "en";

				runtime.overwriteGetLocale(() => locale);

				expect(m.sad_penguin_bundle()).toBe("A simple message.");

				locale = "de";

				expect(m.sad_penguin_bundle()).toBe("Eine einfache Nachricht.");
			});

			test("overwriteSetLocale() works", async () => {
				const { runtime } = await importCode(code);

				let locale = "en";

				runtime.overwriteSetLocale((newLocale: any) => {
					locale = newLocale;
				});

				runtime.setLocale("de");

				expect(locale).toBe("de");
			});

			test.skip("defining onSetLocale should be possible and should be called when the locale changes", async () => {
				const { runtime } = await importCode(code);

				const mockOnSetLocale = vi.fn().mockImplementation(() => {});
				runtime.onSetLocale((locale: any) => {
					mockOnSetLocale(locale);
				});

				runtime.setLocale("de");
				expect(mockOnSetLocale).toHaveBeenLastCalledWith("de");

				runtime.setLocale("en");
				expect(mockOnSetLocale).toHaveBeenLastCalledWith("en");

				expect(mockOnSetLocale).toHaveBeenCalledTimes(2);
			});

			test.skip("Calling onSetLocale() multiple times should override the previous callback", async () => {
				const cb1 = vi.fn().mockImplementation(() => {});
				const cb2 = vi.fn().mockImplementation(() => {});

				const { runtime } = await importCode(code);

				runtime.onSetLocale(cb1);
				runtime.setLocale("en");

				expect(cb1).toHaveBeenCalledTimes(1);

				runtime.onSetLocale(cb2);
				runtime.setLocale("de");

				expect(cb2).toHaveBeenCalledTimes(1);
				expect(cb1).toHaveBeenCalledTimes(1);
			});

			test("should return the correct message if a locale is set in the message options", async () => {
				const { m, runtime } = await importCode(code);

				// set the language tag to de to make sure that the message options override the runtime language tag
				runtime.setLocale("de");
				expect(m.sad_penguin_bundle()).toBe("Eine einfache Nachricht.");
				expect(m.sad_penguin_bundle(undefined, { locale: "en" })).toBe(
					"A simple message."
				);
			});

			test("runtime.isLocale should only return `true` if a locale is passed to it", async () => {
				const { runtime } = await importCode(code);

				for (const tag of runtime.locales) {
					expect(runtime.isLocale(tag)).toBe(true);
				}

				expect(runtime.isLocale("")).toBe(false);
				expect(runtime.isLocale("pl")).toBe(false);
				expect(runtime.isLocale("--")).toBe(false);
			});

			test("falls back to base locale", async () => {
				const project = await loadProjectInMemory({
					blob: await newProject({
						settings: { locales: ["en", "de", "en-US"], baseLocale: "en" },
					}),
				});

				await insertBundleNested(
					project.db,
					createBundleNested({
						id: "missingInGerman",
						messages: [
							{
								locale: "en",
								variants: [
									{ pattern: [{ type: "text", value: "A simple message." }] },
								],
							},
						],
					})
				);

				const output = await compileProject({
					project,
					compilerOptions,
				});
				const code = await bundleCode(
					output,
					`export * as m from "./paraglide/messages.js"
					export * as runtime from "./paraglide/runtime.js"`
				);

				const { m, runtime } = await importCode(code);

				runtime.setLocale("de");
				expect(m.missingInGerman()).toBe("A simple message.");

				runtime.setLocale("en-US");
				expect(m.missingInGerman()).toBe("A simple message.");
			});

			test("message tracking works", async () => {
				const project = await loadProjectInMemory({
					blob: await newProject({
						settings: { locales: ["en", "de", "fr"], baseLocale: "en" },
					}),
				});

				// Add test messages
				await insertBundleNested(
					project.db,
					createBundleNested({
						id: "greeting",
						messages: [
							{
								locale: "en",
								variants: [{ pattern: [{ type: "text", value: "Hello" }] }],
							},
							{
								locale: "de",
								variants: [{ pattern: [{ type: "text", value: "Hallo" }] }],
							},
							{
								locale: "fr",
								variants: [{ pattern: [{ type: "text", value: "Bonjour" }] }],
							},
						],
					})
				);

				await insertBundleNested(
					project.db,
					createBundleNested({
						id: "farewell",
						messages: [
							{
								locale: "en",
								variants: [{ pattern: [{ type: "text", value: "Goodbye" }] }],
							},
							{
								locale: "de",
								variants: [
									{ pattern: [{ type: "text", value: "Auf Wiedersehen" }] },
								],
							},
							{
								locale: "fr",
								variants: [{ pattern: [{ type: "text", value: "Au revoir" }] }],
							},
						],
					})
				);

				// Compile the project
				const output = await compileProject({
					project,
					compilerOptions,
				});

				const code = await bundleCode(
					output,
					`export * as m from "./paraglide/messages.js"
					export * as runtime from "./paraglide/runtime.js"`
				);

				const { m, runtime } = await importCode(code);

				// Setup AsyncLocalStorage for tracking
				runtime.overwriteServerAsyncLocalStorage(new AsyncLocalStorage());

				// Test tracking in English
				runtime.setLocale("en");
				const messageCalls1 = new Set();
				const result1 = await runtime.serverAsyncLocalStorage.run(
					{ messageCalls: messageCalls1 },
					() => {
						const greeting = m.greeting();
						const farewell = m.farewell();

						expect(greeting).toBe("Hello");
						expect(farewell).toBe("Goodbye");

						return "english";
					}
				);

				expect(result1).toBe("english");
				expect(messageCalls1).toEqual(new Set(["greeting:en", "farewell:en"]));

				// Test tracking in German
				runtime.setLocale("de");
				const messageCalls2 = new Set();
				const result2 = await runtime.serverAsyncLocalStorage.run(
					{ messageCalls: messageCalls2 },
					() => {
						const greeting = m.greeting();

						expect(greeting).toBe("Hallo");

						return "german";
					}
				);

				expect(result2).toBe("german");
				expect(messageCalls2).toEqual(new Set(["greeting:de"]));
				expect(messageCalls2.has("farewell:de")).toBe(false);

				// Test tracking with explicit locale
				const messageCalls3 = new Set();
				const result3 = await runtime.serverAsyncLocalStorage.run(
					{ messageCalls: messageCalls3 },
					() => {
						const greeting = m.greeting(undefined, { locale: "fr" });

						expect(greeting).toBe("Bonjour");

						return "explicit";
					}
				);

				expect(result3).toBe("explicit");
				expect(messageCalls3).toEqual(new Set(["greeting:fr"]));

				// Test nested tracking contexts
				const messageCalls4 = new Set();
				const result4 = await runtime.serverAsyncLocalStorage.run(
					{ messageCalls: messageCalls4 },
					() => {
						// Access a message in the outer context
						const outerGreeting = m.greeting();
						expect(outerGreeting).toBe("Hallo"); // Still in German locale

						// Create a nested tracking context
						const nestedMessageCalls = new Set();
						const nestedResult = runtime.serverAsyncLocalStorage.run(
							{ messageCalls: nestedMessageCalls },
							() => {
								// Access different messages in the nested context
								const nestedFarewell = m.farewell();
								expect(nestedFarewell).toBe("Auf Wiedersehen");

								return "nested";
							}
						);

						// Verify nested tracking
						expect(nestedResult).toBe("nested");
						expect(nestedMessageCalls).toEqual(new Set(["farewell:de"]));
						expect(nestedMessageCalls.has("greeting:de")).toBe(false); // Not accessed in nested context

						return "outer";
					}
				);

				// Verify outer context only contains its own calls
				expect(result4).toBe("outer");
				expect(messageCalls4).toEqual(new Set(["greeting:de"]));
				// The farewell message should not be in the outer context
				expect(messageCalls4.has("farewell:de")).toBe(false);
			});

			test("arbitrary module identifiers work", async () => {
				const project = await loadProjectInMemory({
					blob: await newProject({
						settings: { locales: ["en", "de"], baseLocale: "en" },
					}),
				});

				await insertBundleNested(
					project.db,
					createBundleNested({
						id: "$502.23-hello_world",
						messages: [
							{
								locale: "en",
								variants: [
									{ pattern: [{ type: "text", value: "A simple message." }] },
								],
							},
						],
					})
				);

				const output = await compileProject({
					project,
					compilerOptions,
				});

				const code = await bundleCode(
					output,
					`export * as m from "./paraglide/messages.js"
					export * as runtime from "./paraglide/runtime.js"`
				);
				const { m } = await importCode(code);

				expect(m["$502.23-hello_world"]()).toBe("A simple message.");
			});

			test("falls back to parent locale if message doesn't exist", async () => {
				const project = await loadProjectInMemory({
					blob: await newProject({
						settings: { locales: ["en", "en-US"], baseLocale: "en" },
					}),
				});

				await insertBundleNested(
					project.db,
					createBundleNested({
						id: "exists_in_both",
						messages: [
							{
								locale: "en",
								variants: [
									{ pattern: [{ type: "text", value: "A simple message." }] },
								],
							},
							{
								locale: "en-US",
								variants: [
									{
										pattern: [
											{
												type: "text",
												value: "A simple message for Americans.",
											},
										],
									},
								],
							},
						],
					})
				);

				await insertBundleNested(
					project.db,
					createBundleNested({
						id: "missing_in_en_US",
						messages: [
							{
								locale: "en",
								variants: [
									{ pattern: [{ type: "text", value: "Fallback message." }] },
								],
							},
						],
					})
				);

				const output = await compileProject({
					project,
					compilerOptions,
				});

				const code = await bundleCode(
					output,
					`export * as m from "./paraglide/messages.js"
					export * as runtime from "./paraglide/runtime.js"`
				);
				const { m, runtime } = await importCode(code);

				runtime.setLocale("en-US");
				expect(m.exists_in_both()).toBe("A simple message for Americans.");

				runtime.setLocale("en-US");
				expect(m.missing_in_en_US()).toBe("Fallback message.");
			});
		});

		test("case sensitivity handling for bundle IDs", async () => {
			const project = await loadProjectInMemory({
				blob: await newProject({
					settings: { locales: ["en"], baseLocale: "en" },
				}),
			});

			// Create two bundles with the same name but different case
			await insertBundleNested(
				project.db,
				createBundleNested({
					id: "Helloworld",
					messages: [
						{
							locale: "en",
							variants: [
								{ pattern: [{ type: "text", value: "Hello from uppercase bundle" }] },
							],
						},
					],
				})
			);

			await insertBundleNested(
				project.db,
				createBundleNested({
					id: "helloworld",
					messages: [
						{
							locale: "en",
							variants: [
								{ pattern: [{ type: "text", value: "Hello from lowercase bundle" }] },
							],
						},
					],
				})
			);

			const output = await compileProject({
				project,
				compilerOptions,
			});

			const code = await bundleCode(
				output,
				`export * as m from "./paraglide/messages.js"
				export { helloworld, Helloworld } from "./paraglide/messages.js"`
			);

			const imported = await importCode(code);
			
			// Both message functions should be available
			expect(imported.helloworld()).toBe("Hello from lowercase bundle");
			expect(imported.Helloworld()).toBe("Hello from uppercase bundle");
			
			// They should also be available through the m namespace
			expect(imported.m.helloworld()).toBe("Hello from lowercase bundle");
			expect(imported.m.Helloworld()).toBe("Hello from uppercase bundle");
		});

		// whatever the strictest users use, this is the ultimate nothing gets stricter than this
		// (to avoid developers opening issues "i get a ts warning in my code")
		const superStrictRuleOutAnyErrorTsSettings: ProjectOptions["compilerOptions"] =
			{
				outDir: "dist",
				declaration: true,
				allowJs: true,
				checkJs: true,
				noImplicitAny: true,
				noUnusedLocals: true,
				noUnusedParameters: true,
				noImplicitReturns: true,
				noImplicitThis: true,
				noUncheckedIndexedAccess: true,
				noPropertyAccessFromIndexSignature: true,
				module: ts.ModuleKind.Node16,
				strict: true,
			};

		test("./messages.js types", async () => {
			const project = await typescriptProject({
				useInMemoryFileSystem: true,
				compilerOptions: superStrictRuleOutAnyErrorTsSettings,
			});

			for (const [fileName, code] of Object.entries(output)) {
				if (fileName.endsWith(".js") || fileName.endsWith(".ts")) {
					project.createSourceFile(fileName, code);
				}
			}
			project.createSourceFile(
				"test.ts",
				`
    import * as m from "./messages.js"

    // --------- MESSAGES ---------

    // the return value of a message should be a string
    m.insane_cats({ name: "John", count: 5 }) satisfies string
      
    // @ts-expect-error - missing all params
    m.insane_cats()
      
    // @ts-expect-error - one param missing
    m.insane_cats({ name: "John" })

    // a message without params shouldn't require params
    m.sad_penguin_bundle() satisfies string

		// --------- MESSAGE OPTIONS ---------
		// the locale option should be optional
		m.sad_penguin_bundle({}, {}) satisfies string

		// the locale option should be allowed
		m.sad_penguin_bundle({}, { locale: "en" }) satisfies string

		// the locale option must be a valid language tag
		// @ts-expect-error - invalid language tag
		m.sad_penguin_bundle({}, { locale: "---" })
  `
			);

			const program = project.createProgram();
			const diagnostics = ts.getPreEmitDiagnostics(program).filter((d) => {
				// async_hooks is a node module that is not available in the browser
				return !d.messageText
					.toString()
					.includes("Cannot find module 'async_hooks'");
			});
			for (const diagnostic of diagnostics) {
				console.error(diagnostic.messageText, diagnostic.file?.fileName);
			}
			expect(diagnostics.length).toEqual(0);
		});
	}
);

async function bundleCode(output: Record<string, string>, file: string) {
	output["runtime.js"] = output["runtime.js"]!.replace(
		'import "@inlang/paraglide-js/urlpattern-polyfill";',
		"/** @type {any} */const URLPattern = {};"
	).replace(
		'const { AsyncLocalStorage } = await import("async_hooks");',
		"const AsyncLocalStorage = class {};"
	);

	const bundle = await rolldown({
		input: ["main.js"],
		plugins: [
			// @ts-expect-error - rollup types are not up to date
			virtual({
				...Object.fromEntries(
					Object.entries(output).map(([fileName, code]) => [
						"paraglide/" + fileName,
						code,
					])
				),
				"main.js": file,
			}),
		],
	});
	const compiled = await bundle.generate({ format: "esm" });
	const code = compiled.output[0].code;
	return code;
}

async function importCode(code: string) {
	// The random comment ensures that each code is a unique module
	// and state is not shared between imports
	const randomComment = `// ${Math.random()}`;
	const codeWithComment = `${randomComment}\n${code}`;
	return await import(
		`data:application/javascript;base64,${Buffer.from(codeWithComment, "utf8").toString("base64")}`
	);
}

const project = await loadProjectInMemory({
	blob: await newProject({
		settings: {
			baseLocale: "en",
			locales: ["en", "de", "en-US"],
		},
	}),
});

const mockBundles: BundleNested[] = [
	createBundleNested({
		id: "sad_penguin_bundle",
		messages: [
			{
				locale: "en",
				variants: [{ pattern: [{ type: "text", value: "A simple message." }] }],
			},
			{
				locale: "de",
				variants: [
					{ pattern: [{ type: "text", value: "Eine einfache Nachricht." }] },
				],
			},
		],
	}),
	{
		id: "depressed_dog",
		declarations: [
			{
				type: "input-variable",
				name: "name",
			},
		],
		messages: [
			{
				id: "depressed_dog_en",
				bundleId: "depressed_dog",
				locale: "en",
				selectors: [],
				variants: [
					{
						id: "depressed_dog_en_variant_one",
						messageId: "depressed_dog_en",
						matches: [],
						pattern: [
							{ type: "text", value: "Good morning " },
							{
								type: "expression",
								arg: { type: "variable-reference", name: "name" },
							},
							{ type: "text", value: "!" },
						],
					},
				],
			},
			{
				id: "depressed_dog_de",
				bundleId: "depressed_dog",
				locale: "de",
				selectors: [],

				variants: [
					{
						id: "depressed_dog_de_variant_one",
						messageId: "depressed_dog_de",
						matches: [],
						pattern: [
							{ type: "text", value: "Guten Morgen " },
							{
								type: "expression",
								arg: { type: "variable-reference", name: "name" },
							},
							{ type: "text", value: "!" },
						],
					},
				],
			},
		],
	},
	{
		id: "insane_cats",
		declarations: [
			{
				type: "input-variable",
				name: "name",
			},
			{
				type: "input-variable",
				name: "count",
			},
		],
		messages: [
			{
				id: "insane_cats_en",
				bundleId: "insane_cats",
				locale: "en",

				selectors: [],
				variants: [
					{
						id: "insane_cats_en_variant_one",
						messageId: "insane_cats_en",
						matches: [],
						pattern: [
							{ type: "text", value: "Hello " },
							{
								type: "expression",
								arg: { type: "variable-reference", name: "name" },
							},
							{ type: "text", value: "! You have " },
							{
								type: "expression",
								arg: { type: "variable-reference", name: "count" },
							},
							{ type: "text", value: " messages." },
						],
					},
				],
			},
			{
				id: "insane_cats_de",
				bundleId: "insane_cats",
				locale: "de",
				selectors: [],
				variants: [
					{
						id: "insane_cats_de_variant_one",
						messageId: "insane_cats_de",
						matches: [],
						pattern: [
							{ type: "text", value: "Hallo " },
							{
								type: "expression",
								arg: { type: "variable-reference", name: "name" },
							},
							{ type: "text", value: "! Du hast " },
							{
								type: "expression",
								arg: { type: "variable-reference", name: "count" },
							},
							{ type: "text", value: " Nachrichten." },
						],
					},
				],
			},
		],
	},
];

for (const bundle of mockBundles) {
	await insertBundleNested(project.db, bundle);
}

function createBundleNested(args: {
	id: string;
	declarations?: Declaration[];
	messages: {
		selectors?: VariableReference[];
		locale: string;
		variants: {
			matches?: Match[];
			pattern: Pattern;
		}[];
	}[];
}): BundleNested {
	return {
		id: args.id,
		declarations: args.declarations ?? [],
		messages: args.messages.map((message) => ({
			id: args.id + "_" + message.locale,
			bundleId: args.id,
			locale: message.locale,
			selectors: message.selectors ?? [],
			variants: message.variants.map((variant) => ({
				id:
					args.id +
					"_" +
					message.locale +
					"_" +
					Math.random().toString(36).slice(2),
				messageId: args.id,
				matches: variant.matches ?? [],
				pattern: variant.pattern,
			})),
		})),
	};
}
