import type { LintRule } from "@inlang/lint";
import type { InlangConfig, Plugin } from "@inlang/plugin";
import { describe, expect, it } from "vitest";
import type { InlangModule } from "./api.js";
import { ModuleError, ModuleImportError } from "./errors.js";
import { resolveModules } from "./resolveModules.js";

describe("generally", () => {
	it("should return an error if a plugin cannot be imported", async () => {
		// const mockPlugin: Plugin = {
		// 	meta: {
		// 		// @ts-expect-error the id is invalid
		// 		id: "no-namespace",
		// 		description: { en: "" },
		// 		displayName: { en: "" },
		// 		keywords: [],
		// 		usedApis: [],
		// 	},
		// 	setup: () => undefined as any,
		// 	loadMessages: () => undefined as any,
		// 	saveMessages: () => undefined as any,
		// 	addAppSpecificApi() {
		// 		return undefined as any
		// 	},
		// }
		
		// const module: InlangModule = {
		// 	default: {
		// 		plugins: [mockPlugin],
		// 		lintRules: [],
		// 	},
		// }

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		};

		const resolved = await resolveModules({ config, env: {
			$fs: {} as any,
			$import: () => {
				throw new ModuleImportError("Could not import", { module: config.modules[0]!, cause: new Error("Could not import") })
			} 
		} });

		expect(resolved.errors[0]).toBeInstanceOf(ModuleImportError)
	})
});

describe('resolveModules', () => {
	it('should resolve plugins and lint rules successfully', async () => {
	  // Define mock data
	  const mockPlugin: Plugin = {
		meta: {
		  id: 'mock.plugin',
		  description: { en: 'Mock plugin description' },
		  displayName: { en: 'Mock Plugin' },
		  keywords: [],
		},
		setup: () => undefined as any,
		loadMessages: () => undefined as any,
		saveMessages: () => undefined as any,
		addAppSpecificApi: () => undefined as any,
	  };
  
	  const mockLintRule: LintRule = {
		meta: {
		  id: 'mock.lint-rule',
		  description: { en: 'Mock lint rule description' },
		  displayName: { en: 'Mock Lint Rule' },
		},
		defaultLevel: 'error',
		setup: () => undefined as any,
	  };
  
	  const config: InlangConfig = {
		sourceLanguageTag: 'en',
		languageTags: ['de', 'en'],
		modules: ['https://myplugin.com/index.js'],
	  };
  
	  const env = {
		$fs: {} as any,
		$import: async () => ({
		  default: {
			plugins: [mockPlugin],
			lintRules: [mockLintRule],
		  },
		} satisfies InlangModule
		),
	  };
  
	  // Call the function
	  const resolved = await resolveModules({ config, env });	  
  
	  // Assert results
	  expect(resolved.errors).toHaveLength(0);
	  // TODO: Fix this test
	  // expect(resolved.data.plugins.data["meta"]["mock.plugin"]).toBeDefined();
	  expect(resolved.data.lintRules).toHaveLength(1);
	  expect(resolved.data.lintRules[0]!.meta.id).toBe('mock.lint-rule');
	});
  
	it('should return an error if a plugin cannot be imported', async () => {
	  const config: InlangConfig = {
		sourceLanguageTag: 'en',
		languageTags: ['de', 'en'],
		modules: ['https://myplugin.com/index.js'],
	  };
  
	  const errorMessage = 'Could not import';
	  const env = {
		$fs: {} as any,
		$import: async () => {
		  throw new ModuleImportError(errorMessage, {
			module: config.modules[0]!,
			cause: new Error(errorMessage),
		  });
		},
	  };
  
	  // Call the function
	  const resolved = await resolveModules({ config, env });
  
	  // Assert results
	  expect(resolved.errors[0]).toBeInstanceOf(ModuleImportError);
	});
  
	it('should handle invalid lint rule schema', async () => {
	  const invalidLintRule = {
		meta: {
		  id: 'invalid-lint-rule',
		  description: 'This is an invalid lint rule',
		},
		validator: 'thisIsNotAFunction', // Invalid validator, should be a function
	  };
  
	  const config: InlangConfig = {
		sourceLanguageTag: 'en',
		languageTags: ['de', 'en'],
		modules: ['https://myplugin.com/index.js'],
	  };
  
	  const env = {
		$fs: {} as any,
		$import: async () => ({
		  data: {
			default: {
			  plugins: [],
			  // @ts-expect-error the lint rule is invalid
			  lintRules: [invalidLintRule],
			},
		  } satisfies InlangModule,
		  errors: [],
		}),
	  };
  
	  // Call the function
	  const resolved = await resolveModules({ config, env });
  
	  // Assert results
	  expect(resolved.errors[0]).toBeInstanceOf(ModuleError);
	});
  
	it('should handle other unhandled errors during plugin resolution', async () => {
	  const errorMessage = 'Unhandled error during plugin resolution';
	  const config: InlangConfig = {
		sourceLanguageTag: 'en',
		languageTags: ['de', 'en'],
		modules: ['https://myplugin.com/index.js'],
	  };
  
	  const env = {
		$fs: {} as any,
		$import: async () => {
		  throw new Error(errorMessage);
		},
	  };
  
	  // Call the function
	  const resolved = await resolveModules({ config, env });
  
	  // Assert results
	  expect(resolved.errors[0]).toBeInstanceOf(ModuleError);
	});
  });
  

// function mockEnvWithModules (modules: Record<string, any>) {
// 	return {
// 		$import: (module: string) => {
// 			return {
// 				data: modules[module],
// 				error: undefined,
// 			}
// 		},
// 	}
// }

	// it("should return an error if a plugin cannot be imported", async () => {
	// 	const resolved = await resolvePlugins({
	// 		env: {
	// 			$fs: {} as any,
	// 			$import: () => {
	// 				throw Error("Could not import")
	// 			},
	// 		},
	// 		config: {
	// 			plugins: [{ module: "https://myplugin.com/index.js", options: {} }],
	// 		} as InlangConfig,
	// 	})


// describe("addLintRules", () => {
// 	it("should resolve a single lint rule", async () => {
// 		const mockPlugin: Plugin = {
// 			meta: {
// 				id: "plugin.plugin",
// 				description: { en: "" },
// 				displayName: { en: "" },
// 				keywords: [],
// 			},
// 			setup: () => undefined as any,
// 			addLintRules: () => [
// 				{
// 					id: "test.test",
// 					displayName: { en: "" },
// 					defaultLevel: "error",
// 				},
// 			],
// 		}

// 		const pluginModule = "https://myplugin10.com/index.js"
// 		const env = mockEnvWithPlugins({ [pluginModule]: mockPlugin })

// 		const resolved = await resolvePlugins({
// 			env,
// 			config: {
// 				plugins: [
// 					{
// 						options: {},
// 						module: pluginModule,
// 					},
// 				],
// 			} as unknown as InlangConfig,
// 		})

// 		expect(resolved.data.lintRules).toHaveLength(1)
// 	})

// 	it("should resolve multiple lint rules", async () => {
// 		const mockPlugin: Plugin = {
// 			meta: {
// 				id: "plugin.plugin",
// 				description: { en: "" },
// 				displayName: { en: "" },
// 				keywords: [],
// 			},
// 			setup: () => undefined as any,
// 			addLintRules: () => [
// 				{
// 					id: "test.test",
// 					displayName: { en: "" },
// 					defaultLevel: "error",
// 				},
// 				{
// 					id: "test2.test",
// 					displayName: { en: "" },
// 					defaultLevel: "error",
// 				},
// 			],
// 		}

// 		const pluginModule = "https://myplugin11.com/index.js"
// 		const env = mockEnvWithPlugins({ [pluginModule]: mockPlugin })

// 		const resolved = await resolvePlugins({
// 			env,
// 			config: {
// 				plugins: [
// 					{
// 						options: {},
// 						module: pluginModule,
// 					},
// 				],
// 			} as unknown as InlangConfig,
// 		})

// 		expect(resolved.data.lintRules).toHaveLength(2)
// 	})
// })