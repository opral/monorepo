/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("node:path")

// eslint-disable-next-line no-undef
module.exports = {
	plugins: {
		tailwindcss: {
			config: path.join(__dirname, "./tailwind.config.cjs"),
		},
		autoprefixer: {},
	},
}
