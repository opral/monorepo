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
    // import plugins via the following links and replace {owner}, {repo} and {version} with the correct values
    // .JSON resources -> owner = samuelstroschein, repo = inlang-plugin-json, version = 1 
    // .PO resources -> owner = jannesblobel, repo = inlang-plugin-po, version = 1
    const plugin = await env.$import("https://cdn.jsdelivr.net/gh/{owner}/{repo}@{version}/dist/index.js");
    
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
