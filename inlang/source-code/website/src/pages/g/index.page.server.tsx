import { redirect } from "vike/abort"

export async function onBeforeRender() {
	throw redirect("/")
}
