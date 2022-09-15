const typography = require("@inlang/design-system/typography/tailwind-plugin");

module.exports = {
	content: ["./src/**/*.{html,js,svelte,ts}"],

	theme: {
		extend: {},
	},

	plugins: [typography],
};
