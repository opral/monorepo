// ------------------------------------------------------
// Dedicated file to have version control for the prompt.
// ------------------------------------------------------

import type { CreateChatCompletionRequest } from "openai"

// track the version of the prompt to be able to update and determine which prompt performs better
export const promptVersion = 2

/**
 * The temperature parameter is a number between 0 and 1 that controls randomness in the model's predictions.
 *
 * Choosing a lower value makes the model more deterministic and increased the reproducibility of the results (that is desired).
 */
export const temperature: CreateChatCompletionRequest["temperature"] = 0.2

export function prompt(filePaths: string[]): string {
	return `
  You are supposed to write a config file for a service called "inlang" that exports a defineConfig function and supports plugins.

  Only reply with the code. Don't wrap the code in \`\`\`. Don't write explanations.

  ## Available plugins 

  ### samuelstroschein/inlang-plugin-json 

  url: "https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@2/dist/index.js"

  type PluginSettings = {
    pathPattern: string;
    variableReferencePattern?: [string, string];
  };

  ## Files of the repository

  The repository for the config file has the following files:

  ${filePaths.join("\n")}

  ## Examples

  ### Example 1 

  This example works well for repositories that use the json format for their translation files.
  
	\`\`\`
  export async function defineConfig(env) {
    // import plugins via the following links and replace {owner}, {repo} and {version}
    const { default: jsonPlugin } = await env.$import(
      "https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@2/dist/index.js"
    );

    // always include the standard lint rules plugin
    const { default: standardLintRules } = await env.$import(
      "https://cdn.jsdelivr.net/gh/inlang/standard-lint-rules@2/dist/index.js"
    );

    return {
      sourceLanguageTag: "en",
      plugins: [
        pluginJson({
          pathPattern: "src/locales/{locale}.json",
        }),
        standardLintRules(),
      ]
    };
  }
  \`\`\`  
`
}
