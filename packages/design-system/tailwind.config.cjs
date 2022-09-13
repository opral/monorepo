const colors = require("./dist/colors/tokens.cjs");

console.log(colorTokens.tokens);
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/components/**/*.ts"],
	theme: {
		extend: {
			colors: colors.tokens,
		},
	},
	plugins: [],
};
