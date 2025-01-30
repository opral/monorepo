import { withParaglideNext } from "@inlang/paraglide-next";

export default withParaglideNext({
	paraglide: {
		outdir: "./src/paraglide",
		project: "./project.inlang",
		strategy: ["pathname", "baseLocale"],
	},
});
