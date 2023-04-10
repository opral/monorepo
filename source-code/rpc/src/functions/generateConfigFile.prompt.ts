// ------------------------------------------------------
// Dedicated file to have version control for the prompt.
// ------------------------------------------------------

export function prompt(filePaths: string[]): string {
	return `
  You are supposed to write a config file for a service called "inlang" that exports a defineConfig function.

  Only reply with the code. Don't wrap the code in \`\`\`. Don't write explanations.

  The repository for the config file has the following files:

  ${filePaths.join("\n")}
  
	Here is an example config: 
	\`\`\`
  export async function defineConfig(env) {
    // imports happen from jsdelivr with the following pattern:
    // https://cdn.jsdelivr.net/gh/{owner}/{repo}@{version}/{path}
    // We recommend to use major version pinning @1 instead of @1.0.0
    const plugin = await env.$import("https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js");

    const pluginConfig = {
			// the path for resource files. usually nested in a directory named locales, 
			// translations or i18n
      pathPattern: "./locales/{language}.json",
    };

    return {
      referenceLanguage: "en",
      languages: await plugin.getLanguages({
        ...env,
        pluginConfig,
      }),
      readResources: (args) =>
        plugin.readResources({ ...args, ...env, pluginConfig }),
      writeResources: (args) =>
        plugin.writeResources({ ...args, ...env, pluginConfig }),
    };
  }
	\`\`\`  
`
}
