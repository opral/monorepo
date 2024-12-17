import path from "node:path";
import { NextJSProject } from "./scan-next-project";
import { CliStep } from "../utils";

export type Outdir = {
  /**
   * The absolute path to the outdir
   *
   * @example
   *   "/Users/---/dev/next-project/src/paraglide"
   */
  path: string;
  /**
   * The import alias pointing to the outdir
   *
   * @example
   *   "@/paraglide"
   */
  importAlias: string;
};

/**
 * Figures out where the build output should go
 */
export const getOutDir: CliStep<
  { nextProject: NextJSProject },
  { outdir: Outdir }
> = async (ctx) => {
  const outdir: Outdir = {
    path: path.resolve(ctx.nextProject.srcRoot, "paraglide"),
    importAlias: "@/paraglide",
  };
  return { ...ctx, outdir };
};
