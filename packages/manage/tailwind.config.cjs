/* eslint-disable no-undef */

module.exports = {
	content: ["src/**/*.{ts,html}"],
	theme: {
		container: {
			center: true,
		},
		extend: {
			keyframes: {
				"animate-grow": {
					"0%": { maxWidth: "0%" },
					"100%": { maxWidth: "100%" },
				},
			},
			animation: {
				grow: "animate-grow 10s ease-in-out",
			},
		},
	},
	plugins: [],
}
