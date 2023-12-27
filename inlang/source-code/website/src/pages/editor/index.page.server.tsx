import { redirect } from "vike/abort"

const isProduction = process.env.NODE_ENV === "production"

export async function onBeforeRender() {
	if (!isProduction) throw redirect("http://localhost:4003/")
	else throw redirect("https://fink.inlang.com/")
}
