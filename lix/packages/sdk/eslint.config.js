import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["**/*.{js,ts}"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					name: "@lix-js/sdk",
					message:
						"Importing from the compiled dist is not allowed (and you likely did this by accident). Import from source directly instead e.g. `./file.js`",
				},
			],
		},
	},
	{
		files: ["**/*.test.ts"],
		rules: {
			// any makes testing sometimes easier
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
];
