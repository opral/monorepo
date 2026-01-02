# Introduction

With the upcoming @inlang-sdk/js and IDE extension, it became clear that a plugin API is required now to keep the ergonomics of the inlang.config.js manageable and avoid accruing technical debt by forcing app-specific config to be defined in `@inlang/core`.

## Goals

Design/decide on a plugin API that:

- Optimizes for developer experience e.g. simple to configure and simple to write plugins for.
- Enables plugins to define their own config that can be read by other plugins (cross plugin communication) to avoid leaking app-specific config into the core config.
- Consider error handling and error messages. We want to make sure that the user gets meaningful error messages if something goes wrong. Numerous developers ran into https://github.com/opral/inlang/issues/267, wasting hours on debugging.

## Neutral

- Backwards compatibility. We have a few repos using inlang, we can manually open pull requests to update their configs. If a proposal is clearly better, we can also decide to break backwards compatibility.
- Keep future proofing in mind. Inlang will receive Document (markdown) support and more soon. Ideally, the plugin API should be flexible enough to support other types of content in the future.

## Non-goal

- [to be discussed]

## Current status quo

No plugin API. "Plugins" simply define functions.

- This leads to a bloated inlang.config.js, degrading the developer experience by a wide margin. Nobody wants to merge and maintain code that looks like [that](https://github.com/inlang/internal-test/blob/be6028b0767bf2f46c1b3840cf684eea96106ee7/inlang.config.js)
- Plugin/app-specific configuration is leaking into the core config, see https://github.com/opral/inlang/blob/main/packages/versioned-interfaces/project-config/src/interface.ts#L70-L122. This is bad. The result will be a massive config schema that becomes unmaintainable.

```ts
export async function defineConfig(env) {
  const pluginJson = await env.$import(
    "https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js",
  );

  const pluginConfig = {
    pathPattern: "./languages/{language}.json",
  };

  return {
    sourceLanguageTag: "en",
    languageTags: await pluginJson.getLanguages({ ...env, pluginConfig }),
    readResources: (args) =>
      pluginJson.readResources({ ...args, ...env, pluginConfig }),
    writeResources: (args) =>
      pluginJson.writeResources({ ...args, ...env, pluginConfig }),
    // bad. the SDK config shouldn't be defined as part of the core config
    sdk: {
      languageNegotiation: {
        strategies: [{ type: "navigator" }, { type: "localStorage" }],
      },
    },
  };
}
```

## Proposal 1: Spreading

```ts
export async function defineConfig(env) {
  const jsonPlugin = await env.$import(
    "https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js",
  );
  const sdk = await env.$import(
    "https://cdn.jsdelivr.net/gh/opral/inlang1/dist/sdk-js/index.js",
  );
  const ideExtension = await env.$import(
    "https://cdn.jsdelivr.net/gh/opral/inlang1/dist/sdk-js/index.js",
  );

  return {
    sourceLanguageTag: "en",
    ...jsonPlugin({
      pathPattern: "./languages/{language}.json",
    }),
    ...sdk({
      languageNegotiation: {
        strategies: [{ type: "localStorage" }, { type: "navigator" }],
      },
    }),
    ...ideExtension({
      // ...
    }),
  };
}
```

❌ = dealbreaker

| Pros                 |                  Cons                   |
| -------------------- | :-------------------------------------: |
| Simple               | Plugins can't extend previous config ❌ |
| Backwards compatible |      Spreading syntax is uncommon       |
|                      |          no error handling ❌           |

## Proposal 2: Config Wrapping

```ts
export async function defineConfig(env) {
	const { withJson } = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js",
	)
	const { withSdk } = await env.$import(
		"https://cdn.jsdelivr.net/gh/opral/inlang1/dist/sdk-js/index.js",
	)

	return
    withJson(
      withSdk(
        withIdeExtension({
          {
            sourceLanguageTag: "en",
            sdk: {
              languageNegotiation: {
                strategies: [{ type: "localStorage" }, { type: "navigator" }],
              },
            }
          }
        }),
      )
    )
}
```

❌ = dealbreaker

|         Pros         |                       Cons                        |
| :------------------: | :-----------------------------------------------: |
|        Simple        | Every plugin takes entire core config as argument |
| Backwards compatible |            Nesting becomes convoluted             |
|                      |               no error handling ❌                |
|                      |        unclear when to execute a plugin ❌        |

## Proposal 3: `use` API

```ts
export async function setup({ defineConfig, env }) {
  const pluginJson = await env.$import(
    "https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js",
  );
  const sdk = await env.$import(
    "https://cdn.jsdelivr.net/gh/opral/inlang@1/dist/sdk-js/index.js",
  );

  return defineConfig({
    sourceLanguageTag: "en",
  })
    .use(
      pluginJson({
        pathPattern: "./languages/{language}.json",
      }),
    )
    .use(
      sdk({
        languageNegotiation: {
          strategies: [{ type: "localStorage" }, { type: "navigator" }],
        },
      }),
    );
}
```

|                       Pros                       |                      Cons                      |
| :----------------------------------------------: | :--------------------------------------------: |
| Apps can read, extend and modify previous config |    Host applications must pass defineConfig    |
|            No deep nesting of plugins            |                breaking change                 |
|                                                  | `use` seems unnecessary compared to proposal 4 |

Have a setup function that includes a defineConfig function. The return of `defineConfig` can be extended by calling `use` on it.

A major downside is two-fold increase in complexity:

1. Host applications must pass `defineConfig` to plugins, complicating the "consumption" of the inlang.config.js file.
2. Consumers face two different APIs to define the config: `defineConfig` for core stuff and `use` for plugin stuff. That's a bit implicit.
3. Consumers need to understand the concept of `setup` and `defineConfig`. In the current design `defineConfig` is the only setup function and concept that needs to be understood.

## Proposal 4: `plugins` property

```ts
export async function defineConfig(env) {
  const pluginJson = await env.$import(
    "https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js",
  );
  const sdk = await env.$import(
    "https://cdn.jsdelivr.net/gh/opral/inlang@1/dist/sdk-js/index.js",
  );

  const standardLintRules = await env.$import(
    "https://cdn.jsdelivr.net/gh/opral/inlang@1/dist/sdk-js/index.js",
  );

  return {
    sourceLanguageTag: "en",
    plugins: [
      // @ivanhofer @jannesblobel the "collection" discussion is resolved with this approach.
      // just use standardLintRules as plugin 🎉
      standardLintRules(),
      pluginJson({
        pathPattern: "./languages/{language}.json",
      }),
      sdk({
        languageNegotiation: {
          strategies: [{ type: "localStorage" }, { type: "navigator" }],
        },
      }),
    ],
  };
}
```

|                       Pros                       |                           Cons                            |
| :----------------------------------------------: | :-------------------------------------------------------: |
| Apps can read, extend and modify previous config | Requires a utility functions that executes `defineConfig` |
|            No deep nesting of plugins            |                                                           |
|    familiar interface (vite, rollup), good DX    |                                                           |
|                no breaking change                |                                                           |
|       flexible, future proof architecture        |                                                           |
|              Error handling system               |                                                           |
|                                                  |                                                           |

This proposal is simple and flexible.

1. Have a utility function called `createPlugin` [similar to `createLintRule` in the lint rule system](https://github.com/opral/inlang/blob/main/packages/versioned-interfaces/message-lint-rule/src/interface.ts#L21-L49).

2. Have a `plugins` property that takes an array of plugins in @inlang/core/config:

```ts
return {
  sourceLanguageTag: "en",
  plugins: [
    // pluginJson
    pluginJson({
      pathPattern: "./languages/{language}.json",
    }),
  ],
}``;
```

3. Have a utility function `setupPlugins` that wraps `defineConfig` to merge the configs of all plugins:

```ts
const config = await setupPlugins(defineConfig(env));
```

Example Input:

```
{
  sourceLanguageTag: "en",
  plugins: [
    [Function: myPlugin]
  ]
}

```

Example Output:

_`withPlugins` executes `defineConfig` (which should be executed on loading the inlang config)_

```
{
  sourceLanguageTag: "en",
  languages: ["en", "de"],
  readResources: [Function: readResources],
  writeResources: [Function: writeResources],
  plugins: [
    {
      id: "samuelstroschein.plugin-json",
      defineConfig: [Function: defineConfig]
    }
  ]
}
```

**Why this approach seems good**

1. We can extend the `plugins` property to support more complex use cases in the future:

```ts
type Plugin = {
  id: string;
  config: () => MaybePromise<Partial<Config>>;
  // anything else we need in the future like resolvedConfig for example
  resolvedConfig: (config: Config) => Promise<void>;
};
```

2. The consumption API of plugins is familiar and simple.

```ts
pluginJson({
  pathPattern: "./languages/{language}.json",
});
```
