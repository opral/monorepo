import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["**/*.{js,ts}"],
		rules: {
			// any makes testing sometimes easier
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
];
