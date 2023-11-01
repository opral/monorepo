import { redirect } from "vite-plugin-ssr/abort"

export async function onBeforeRender() {
	throw redirect("/")
}
