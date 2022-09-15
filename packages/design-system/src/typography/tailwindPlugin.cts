import plugin from "tailwindcss/plugin";
import { tokens } from "./tokens.cjs";

// tailwind requires commonjs
// therefore, `module.exports` instead of `export plugin`
module.exports = plugin(({ addUtilities }) => {
	addUtilities(tokens);
});
