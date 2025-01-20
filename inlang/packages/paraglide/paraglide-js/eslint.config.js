import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			// any makes testing sometimes easier
			"@typescript-eslint/no-explicit-any": "off",
			// Disable no-undef for runtime files
			// which make use of global variables.
			// overwrites for the runtime files didn't work
			// in eslint 9
			"no-undef": "off",
		},
	},
];
