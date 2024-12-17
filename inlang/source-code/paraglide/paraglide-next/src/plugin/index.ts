import type { NextConfig } from "next";
import { addAlias } from "./alias";
import { once } from "./utils";
import { useCompiler } from "./useCompiler";

type ParaglideConfig = {
  /**
   * Where the Inlang Project that defines the languages
   * and messages is located.
   *
   * This should be a relative path starting from the project root.
   *
   * @example "./project.inlang"
   */
  project: string;

  /**
   * Where the paraglide output files should be placed. This is usually
   * inside a `src/paraglide` folder.
   *
   * This should be a relative path starting from the project root.
   *
   * @example "./src/paraglide"
   */
  outdir: string;

  /**
   * If true, the paraglide compiler will only log errors to the console
   *
   * @default false
   */
  silent?: boolean;
};

type Config = NextConfig & {
  paraglide: ParaglideConfig;
};

/**
 * Add this to your next.config.js.
 * It will register any aliases required by Paraglide-Next,
 * and register the build plugin.
 */
export function paraglide(config: Config): NextConfig {
  const aliasPath = config.paraglide.outdir.endsWith("/")
    ? config.paraglide.outdir + "runtime.js"
    : config.paraglide.outdir + "/runtime.js";

  addAlias(config, {
    "$paraglide/runtime.js": aliasPath,
  });

  // Next calls `next.config.js` TWICE. Once in a worker and once in the main process.
  // We only want to compile the Paraglide project once, so we only do it in the main process.
  once(() => {
    useCompiler({
      project: config.paraglide.project,
      outdir: config.paraglide.outdir,
      watch: process.env.NODE_ENV === "development",
      silent: config.paraglide.silent ?? false,
    });
  });

  const nextConfig: NextConfig = config;
  delete nextConfig.paraglide;

  return nextConfig;
}
