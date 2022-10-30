const {
	colorSystem,
	components,
} = require("@inlang/design-system/tailwind-plugins");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {},
	},
	plugins: [
		require("@tailwindcss/typography"),
		require("@tailwindcss/forms"),
		colorSystem.configure(),
		components.configure(),
	],
};
