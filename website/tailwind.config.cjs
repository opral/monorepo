const typography = require("@inlang/design-system/typography/tailwind-plugin");
const colors = require("@inlang/design-system/colors/tailwind-plugin");

module.exports = {
	content: ["./src/**/*.{html,js,svelte,ts}"],

	theme: {
		extend: {},
	},

	plugins: [typography, colors.withConfig()],
};
