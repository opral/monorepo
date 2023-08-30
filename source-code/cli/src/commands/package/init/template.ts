import type { PackageInitOptions } from "./command.js"
import cliPkg from "../../../../package.json"
import pluginPkg from "../../../../../core/plugin/package.json"
import lintPkg from "../../../../../core/lint/package.json"
import { dedent } from "ts-dedent"

export function getTemplate(options: { type: PackageInitOptions["type"] }) {
	const mergeWith = options.type === "lintRule" ? lintRuleTemplate : pluginTemplate
	return {
		...mergeWith,
		"./.vscode/extensions.json": dedent`{
      "recommendations": [
        "inlang.vs-code-extension"
      ]
    }`,
		"./.gitignore": dedent`
      node_modules
      dist
      .DS_Store
    `,
		"./package.json": dedent`{
      "version": "0.0.1",
      "type": "module",
      "files": [
        "./dist"
      ],
      "scripts": {
        "build": "inlang package build --entry ./src/index.ts",
        "dev": "inlang package build --entry ./src/index.ts --watch"
      },
      "devDependencies": {
        "typescript": "^${cliPkg.devDependencies.typescript}",
        "@inlang/cli": "^${cliPkg.version}",
        ${
					options.type === "lintRule"
						? `"@inlang/lint-rule": "^${lintPkg.version}"`
						: `"@inlang/plugin": "^${pluginPkg.version}"`
				}
      }
    }`,
		"./tsconfig.json": dedent`
    {
      "include": ["src/**/*"],
      "compilerOptions": {
        // strict ES module
        "module": "Node16",
        // strict ES module 
        "moduleResolution": "node16",
        // enable strict type checking (recommended, reduces bugs)
        "strict": true,
        // to improve bundling, types should explicitly importes as types
        "verbatimModuleSyntax": true,
        // in case you write JS, JS files should be checked for errors too
        "checkJs": true
      }
    }    
    `,
	}
}

const pluginTemplate = {
	"./src/index.ts": dedent`
    import { plugin } from "./plugin.js"

    export default {
      plugins: [plugin]
    }
  `,
	"./src/plugin.ts": dedent`
    import type { Plugin } from "@inlang/plugin"

    export const plugin: Plugin = {
      meta: {
        id: "plugin.yourHandle.templateLintRule",
        displayName: { en: "Choose your name" },
        description: { en: "Describe your plugin" },
        // if you want to pubish your pugin to the marketplace, fill out the marketplace field
        // marketplace: {
        // 	icon: "",
        // 	publisherName: "",
        // 	publisherIcon: "",
        // 	linkToReadme: {
        // 		en: "",
        // 	},
        // 	keywords: [],
        // },
      },
      // APIs
    }  
  `,
}

const lintRuleTemplate = {
	"./src/index.ts": dedent`
    import { rule } from "./rule.js"

    export default {
      lintRules: [rule]
    }
  `,
	"./src/lintRule.ts": dedent`
    import type { LintRule } from "@inlang/lint"

    export const rule: LintRule = {
      meta: {
        id: "lintRule.yourHandle.templateLintRule",
        displayName: { en: "Choose your name" },
        description: { en: "Describe your plugin" },
        // if you want to pubish your pugin to the marketplace, fill out the marketplace field
        // marketplace: {
        // 	icon: "",
        // 	publisherName: "",
        // 	publisherIcon: "",
        // 	linkToReadme: {
        // 		en: "",
        // 	},
        // 	keywords: [],
        // },
      },
      type: "MessageLint",
      message: ({ message }) => {
        // implement your lint rule here
      },
    }
  `,
}
