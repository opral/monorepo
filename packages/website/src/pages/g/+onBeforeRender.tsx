import { redirect } from "vike/abort";

export default async function onBeforeRender() {
  throw redirect("/", 301);
}
