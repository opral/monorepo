import type { PageContext } from "#src/renderer/types.js";
import { redirect } from "vike/abort";

const isProduction = process.env.NODE_ENV === "production";

export default async function onBeforeRender(pageContext: PageContext) {
  const { host, owner, repository } = pageContext.routeParams;

  if (!isProduction)
    throw redirect(`http://localhost:4003/${host}/${owner}/${repository}`, 301);
  else
    throw redirect(
      `https://fink.inlang.com/${host}/${owner}/${repository}`,
      301,
    );
}
