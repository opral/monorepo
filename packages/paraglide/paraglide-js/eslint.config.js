import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			// any makes testing sometimes easier
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
	{
		overrides: [
			{
				// Disable no-undef for runtime files
				// which make use of global variables
				files: ["./src/compiler/runtime/*"],
				rules: {
					"no-undef": "off",
				},
			},
		],
	},
];
