import { redirect } from "vike/abort";

const isProduction = process.env.NODE_ENV === "production";

export default async function onBeforeRender() {
  if (!isProduction) throw redirect("http://localhost:4003/", 301);
  else throw redirect("https://fink.inlang.com/", 301);
}
