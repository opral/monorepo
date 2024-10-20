import { redirect } from "vike/abort";
import type { PageContextBuiltInServer } from "vike/types";

export default async function onBeforeRender(
  pageContext: PageContextBuiltInServer,
) {
  if (pageContext.urlParsed.searchOriginal) {
    throw redirect(
      `https://badge.inlang.com/${pageContext.urlParsed.searchOriginal}`,
      301,
    );
  }

  throw redirect("https://badge.inlang.com/", 301);
}
