import { withParaglide } from "@inlang/paraglide-js-adapter-next/plugin"

/** @type {import('next').NextConfig} */
const nextConfig = withParaglide(
	{
		project: "./project.inlang",
		outdir: "./src/paraglide",
	},
	{}
)

export default nextConfig
