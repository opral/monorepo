import type { Repository } from "@lix-js/client";
import type { CliStep } from "../../utils";
import type { Logger } from "@inlang/paraglide-js/internal";
import type { InlangProject } from "@inlang/sdk";
import { NextJSProject } from "../scan-next-project";

export const addI18nToNextConfig: CliStep<
  {
    repo: Repository;
    logger: Logger;
    project: InlangProject;
    nextProject: NextJSProject;
  },
  unknown
> = async (ctx) => {
  const configFile = await ctx.repo.nodeishFs.readFile(
    ctx.nextProject.configFile.path,
    {
      encoding: "utf-8",
    },
  );

  // check if pages router i18n is already set up
  const i18nRegex = /i18n\s*:\s*\{/g;
  if (i18nRegex.test(configFile)) {
    ctx.logger.info("Pages router i18n is already set up - Skipping");
    return ctx;
  }

  // try finding the start of the config object
  // by default it's called `nextConfig`
  const nextConfigDeclarationRegex = /(let|const|var)\s+nextConfig\s*=\s*\{/g;
  const match = nextConfigDeclarationRegex.exec(configFile);
  if (!match) {
    ctx.logger.warn(
      "Failed to set up Pages Router i18n - Please do so automatically\nSee: https://nextjs.org/docs/pages/building-your-application/routing/internationalization",
    );
    return ctx;
  }

  const projectSettings = ctx.project.settings();

  // add the i18n object
  const i18nObject = `\n	i18n: {
		locales: ${JSON.stringify(projectSettings.languageTags)},
		defaultLocale: ${JSON.stringify(projectSettings.sourceLanguageTag)},
	},\n`;

  //insert it at the end of the match
  const newConfigFile =
    configFile.slice(0, match.index + match[0].length) +
    i18nObject +
    configFile.slice(match.index + match[0].length);

  // write the new config file
  await ctx.repo.nodeishFs.writeFile(
    ctx.nextProject.configFile.path,
    newConfigFile,
  );
  return ctx;
};
