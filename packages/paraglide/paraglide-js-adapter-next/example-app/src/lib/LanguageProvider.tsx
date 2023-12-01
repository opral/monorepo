import { languageTag, setLanguageTag } from "@/paraglide/runtime"
import { headers } from "next/headers"
import { ClientLanguageProvider } from "./ClientLanguageProvider"

//This only needs to be called once, so it's fine to do it here
setLanguageTag(() => {
	return headers().get("x-language-tag") as any
})

export default function LanguageProvider(props: { children: React.ReactNode }) {
	//we make the client side language provider a sibling of the children
	//That way the entire app isn't turned into a client component
	return (
		<>
			<ClientLanguageProvider language={languageTag()} />
			{props.children}
		</>
	)
}
