// @ts-check
import globals from "globals"

import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import unicorn from "eslint-plugin-unicorn"
import prettier from "eslint-plugin-prettier"

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
	languageOptions: {
		globals: {
			...globals.browser,
		},
	},
	plugins: {
		unicorn,
		prettier,
	},
	rules: {
		"no-restricted-imports": [
			"error",
			{
				patterns: [
					{
						group: ["node:*"],
						message: "Keep in mind that node API's don't work inside the browser",
					},
				],
			},
		],
		"unicorn/no-null": "warn",
		"unicorn/no-for-loop": "error",
		"unicorn/no-array-for-each": "warn",
		"unicorn/no-lonely-if": "warn",
		"unicorn/prefer-array-find": "warn",
		"unicorn/prefer-array-some": "warn",
		"unicorn/prefer-at": "warn",
		"unicorn/prefer-includes": "warn",
		"unicorn/prefer-object-from-entries": "warn",
		"unicorn/prefer-spread": "warn",
		"unicorn/prefer-string-slice": "warn",
		"unicorn/prefer-ternary": "off",
		"unicorn/prefer-node-protocol": "error",
		"@typescript-eslint/ban-ts-comment": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"no-console": [
			"error",
			{
				allow: [
					"debug",
					"error",
					"info",
					"warn",
					"dir",
					"dirxml",
					"table",
					"trace",
					"group",
					"groupCollapsed",
					"groupEnd",
					"clear",
					"count",
					"countReset",
					"assert",
					"profile",
					"profileEnd",
					"time",
					"timeLog",
					"timeEnd",
					"timeStamp",
					"context",
					"createTask",
					"memory",
				],
			},
		],
		"@typescript-eslint/no-non-null-assertion": "warn",
	},
})
