import { redirect } from "vike/abort";

export default async function onBeforeRender() {
  throw redirect("https://fink.inlang.com/", 301);
}
