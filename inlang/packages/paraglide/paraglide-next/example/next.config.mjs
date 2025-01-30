import { withParaglideNext } from "@inlang/paraglide-next";

export default withParaglideNext({
	paraglide: {
		outdir: "./src/paraglide",
		project: "./project.inlang",
		strategy: ["pathname", "baseLocale"],
	},
	eslint: {
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
});
