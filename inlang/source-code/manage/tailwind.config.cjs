/* eslint-disable no-undef */

import defaultTheme from "tailwindcss/defaultTheme"

module.exports = {
	content: ["src/**/*.{ts,html}"],
	theme: {
		container: {
			center: true,
		},
		extends: {
			fontFamily: {
				sans: ["Inter var", "Inter", ...defaultTheme.fontFamily.sans],
			},
		},
	},
	plugins: [],
}
