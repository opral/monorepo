import path from "node:path";
import { NextJSProject } from "../scan-next-project";
import { Logger } from "@inlang/paraglide-js/internal";
import { Repository } from "@lix-js/client";
import { CliStep } from "../../utils";

export const addLanguageProvider: CliStep<
  {
    repo: Repository;
    logger: Logger;
    nextProject: NextJSProject;
  },
  unknown
> = async (ctx) => {
  const layoutFilePath = path.join(
    ctx.nextProject.srcRoot,
    ctx.nextProject.typescript ? "app/layout.tsx" : "app/layout.js",
  );
  let layoutFileContent: string;
  try {
    layoutFileContent = await ctx.repo.nodeishFs.readFile(layoutFilePath, {
      encoding: "utf-8",
    });
  } catch (e) {
    ctx.logger.warn(
      "Failed to add the `<LanguageProvider>` to `app/layout.tsx`. You'll need to add it yourself",
    );
    return ctx;
  }

  if (layoutFileContent.includes("LanguageProvider")) {
    ctx.logger.warn(
      "Skipping add ingthe `<LanguageProvider>` to `app/layout.tsx` as it already seems to be added",
    );
    return ctx;
  }

  layoutFileContent = `import { LanguageProvider } from "@inlang/paraglide-next"\nimport { languageTag } from "@/paraglide/runtime.js"\n${layoutFileContent}`;
  layoutFileContent = layoutFileContent.replace(
    'lang="en"',
    `lang={languageTag()}`,
  );

  //find the "<html" literal & it's indentation
  const htmlIndex = layoutFileContent.indexOf("<html");
  if (htmlIndex === -1) {
    ctx.logger.warn(
      "Failed to add the `<LanguageProvider>` to `app/layout.tsx`. You'll need to add it yourself",
    );
    return ctx;
  }

  const indentationMatch = layoutFileContent.slice(0, htmlIndex).match(/\s+/);
  const htmlIndentation =
    indentationMatch?.[indentationMatch.length - 1] || "    ";

  layoutFileContent = layoutFileContent.replace(
    "<html",
    `<LanguageProvider>\n${htmlIndentation}  <html`,
  );
  layoutFileContent = layoutFileContent.replace(
    "/html>",
    `/html>\n${htmlIndentation}</LanguageProvider>`,
  );

  await ctx.repo.nodeishFs.writeFile(layoutFilePath, layoutFileContent);
  return ctx;
};
