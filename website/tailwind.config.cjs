const { colors, typography, components } = require("@inlang/design-system");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {},
	},
	plugins: [typography.configure(), colors.configure(), components.configure()],
	safelist: [...components.usedUtilityClasses()],
};
