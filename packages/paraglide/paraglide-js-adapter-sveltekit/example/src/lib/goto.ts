//@ts-ignore
import translatePath from "paraglide-adapter-sveltekit:translate-path"
import { goto } from "$app/navigation"

type GotoArgs = Parameters<typeof goto>

export function gotoTranslated(...args: GotoArgs) {
	const [path, ...rest] = args
	const translatedPath: string = translatePath(path)
	return goto(translatedPath, ...rest)
}
