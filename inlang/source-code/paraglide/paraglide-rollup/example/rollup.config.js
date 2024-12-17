import { paraglide } from "@inlang/paraglide-rollup";
import alias from "@rollup/plugin-alias";
import { fileURLToPath } from "node:url";

export default {
  plugins: [
    alias({
      entries: {
        // This is the alias you can use in your code
        // you can change it to whatever you want
        $paraglide: fileURLToPath(new URL("./src/paraglide", import.meta.url)),
      },
    }),
    paraglide({
      project: "./project.inlang",
      outdir: "./src/paraglide",
    }),
  ],
  output: {
    dir: "dist",
    format: "esm",
  },
};
