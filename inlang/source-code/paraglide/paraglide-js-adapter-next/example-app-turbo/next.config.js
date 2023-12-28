const { withParaglide } = require("@inlang/paraglide-js-adapter-next/plugin")

/** @type {import('next').NextConfig} */
const config = withParaglide(
	{
		project: "./project.inlang",
		outdir: "./src/paraglide",
	},
	{}
)
module.exports = config
