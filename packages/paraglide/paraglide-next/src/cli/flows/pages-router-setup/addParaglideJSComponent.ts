import { Repository } from "@lix-js/client";
import { CliStep, succeedOrElse } from "../../utils";
import { Logger } from "@inlang/paraglide-js/internal";
import { NextJSProject } from "../scan-next-project";
import path from "node:path";

export const addParaglideJsComponent: CliStep<
  { repo: Repository; logger: Logger; nextProject: NextJSProject },
  unknown
> = async (ctx) => {
  const appFilePath = path.join(
    ctx.nextProject.srcRoot,
    ctx.nextProject.typescript ? "pages/_app.tsx" : "pages/_app.js",
  );

  const documentFilePath = path.join(
    ctx.nextProject.srcRoot,
    ctx.nextProject.typescript ? "pages/_document.tsx" : "pages/_document.js",
  );

  let [appFile, documentFile] = await Promise.all([
    succeedOrElse(
      ctx.repo.nodeishFs.readFile(appFilePath, { encoding: "utf-8" }),
      "",
    ),
    succeedOrElse(
      ctx.repo.nodeishFs.readFile(documentFilePath, { encoding: "utf-8" }),
      "",
    ),
  ]);

  if (!documentFile.includes("languageTag")) {
    documentFile =
      'import { languageTag } from "@/paraglide/runtime"\n' +
      documentFile.replace(
        /lang=('|")[a-zA-Z]{2}('|")/g,
        `lang={languageTag()}`,
      );
  }

  if (!appFile.includes("ParaglideJS")) {
    appFile =
      'import { ParaglideJS } from "@inlang/paraglide-next/pages"\n' +
      appFile.replace("<Component", "<ParaglideJS><Component");

    if (appFile.includes("</Component>")) {
      appFile = appFile.replace("</Component>", "</ParaglideJS></Component>");
    } else {
      appFile = replaceLast(appFile, "/>", "/></ParaglideJS>");
    }
  }

  await Promise.all([
    ctx.repo.nodeishFs.writeFile(appFilePath, appFile),
    ctx.repo.nodeishFs.writeFile(documentFilePath, documentFile),
  ]);

  return ctx;
};

function replaceLast(source: string, pattern: string, replacement: string) {
  const lastIndex = source.lastIndexOf(pattern);
  if (lastIndex === -1) return source;
  return (
    source.slice(0, lastIndex) +
    replacement +
    source.slice(lastIndex + pattern.length)
  );
}
