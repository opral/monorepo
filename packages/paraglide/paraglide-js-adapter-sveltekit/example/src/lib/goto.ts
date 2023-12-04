//@ts-ignore
import translatePath from "paraglide-adapter-sveltekit:translate-path"
import { goto as sk_goto } from "$app/navigation"
import { languageTag } from "$paraglide/runtime"

type GotoArgs = Parameters<typeof sk_goto>
type Path = GotoArgs[0]
type Options = (GotoArgs[1] & { language?: string }) | undefined

export function goto(path: Path, options: Options) {
	const language = options?.language ?? languageTag()
	const translatedPath: string = translatePath(path, language)
	return sk_goto(translatedPath, options)
}
