import path from "node:path";
import { Logger } from "@inlang/paraglide-js/internal";
import { CliStep, normalizePath } from "../utils";
import { Repository } from "@lix-js/client";
import { NextJSProject } from "./scan-next-project";
import { Outdir } from "./getOutDir";

export const addParaglideNextPluginToNextConfig: CliStep<
  {
    logger: Logger;
    repo: Repository;
    outdir: Outdir;
    projectPath: string;
    nextProject: NextJSProject;
  },
  unknown
> = async (ctx) => {
  //read the next.config.js file
  let fileContent: string;
  try {
    fileContent = await ctx.repo.nodeishFs.readFile(
      ctx.nextProject.configFile.path,
      {
        encoding: "utf-8",
      },
    );
  } catch (e) {
    ctx.logger.error(
      "Failed to read next config file at " + ctx.nextProject.configFile.path,
    );
    process.exit(1);
  }

  if (fileContent.includes("paraglide")) {
    ctx.logger.warn(
      "Skipping adding the paraglide plugin to `next.config.js` as it already seems to be added",
    );
    return ctx;
  }

  //Add the import
  const importStatement: string = {
    esm: 'import { paraglide } from "@inlang/paraglide-next/plugin"',
    cjs: 'const { paraglide } = require("@inlang/paraglide-next/plugin")',
  }[ctx.nextProject.configFile.type];

  fileContent = importStatement + "\n" + fileContent;

  const exportRegex = {
    esm: /export\s+default\s+(?<configIdentifier>[a-zA-Z0-9]+)(?=\s|;)/gm,
    cjs: /module.exports\s+=\s+(?<configIdentifier>[a-zA-Z0-9]+)(?=\s|;)/gm,
  }[ctx.nextProject.configFile.type];

  const match = exportRegex.exec(fileContent);
  if (!match) {
    ctx.logger.warn(
      `Failed to find the export default statement in next.config.js
You will have to add the paraglide plugin manually

Learn how to do that in the documentation:
https://inlang.com/m/osslbuzt/paraglide-next-i18n
`,
    );
  } else {
    const exportDefault = match;
    const startIndex = exportDefault.index;
    const endIndex = startIndex + exportDefault[0].length;
    const configIdentifier = match.groups?.configIdentifier as string;
    const identifierStartIndex = endIndex - configIdentifier.length;

    const posixCWD = normalizePath(process.cwd());

    const relativeOutdir =
      "./" + path.posix.relative(posixCWD, normalizePath(ctx.outdir.path));
    const relativeProjectPath =
      "./" + path.posix.relative(posixCWD, normalizePath(ctx.projectPath));

    const wrappedIdentifier = `paraglide({
	paraglide: {
		project: "${relativeProjectPath}",
		outdir: "${relativeOutdir}"
	},
	...${configIdentifier}
})`;

    //replace the wrapped identifier with the actual identifier
    fileContent =
      fileContent.slice(0, Math.max(0, identifierStartIndex)) +
      wrappedIdentifier +
      fileContent.slice(Math.max(0, endIndex));

    ctx.logger.info("Added the paraglide plugin to next.config.js");
    await ctx.repo.nodeishFs.writeFile(
      ctx.nextProject.configFile.path,
      fileContent,
    );
  }

  return ctx;
};
