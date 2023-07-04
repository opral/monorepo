/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
  const { default: jsonPlugin } = await env.$import(
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-json@3/dist/index.js"
  );

  const { default: standardLintRules } = await env.$import(
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-standard-lint-rules@3/dist/index.js"
  );

  return {
    referenceLanguage: "en",
    plugins: [
      jsonPlugin({ pathPattern: "lang/{language}.json" }),
      standardLintRules(),
    ],
  };
}
