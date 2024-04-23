import lixStyle from "@lix-js/code-style"
import globals from "globals"

export default [
	...lixStyle,
	{
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			"no-restricted-imports": "off",
		},
		ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
	},
]
