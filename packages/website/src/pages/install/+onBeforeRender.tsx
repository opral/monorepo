import type { PageContext } from "#src/renderer/types.js";
import { redirect } from "vike/abort";

export default async function onBeforeRender(pageContext: PageContext) {
  throw redirect(
    `https://manage.inlang.com/install${pageContext.urlParsed.searchOriginal}`,
  );
}
