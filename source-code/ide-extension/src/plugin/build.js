/**
 * This is the build script for the project.
 *
 * It takes the source code and bundles it into a single file
 * that can be imported into an inlang project.
 */

import { context } from "esbuild";
import { pluginBuildConfig } from "@inlang/core/plugin";

const options = await pluginBuildConfig({
  entryPoints: ["./src/plugin/index.js"],
  outfile: "./dist/plugin/index.js",
  minify: true,
});

const ctx = await context(options);

if (process.env.DEV) {
  await ctx.watch();
  console.info("👀 watching for changes...");
} else {
  await ctx.rebuild();
  console.info("✅ build complete");
  await ctx.dispose();
}