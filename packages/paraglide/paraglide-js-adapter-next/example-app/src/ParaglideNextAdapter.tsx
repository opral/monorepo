import { languageTag, setLanguageTag } from "@/paraglide/runtime"
import { headers } from "next/headers"
import { ClientSideLanguageProvider } from "./ClientsideLanguageProvider"

//This only needs to be called once, so it's fine to do it here
setLanguageTag(() => {
	return headers().get("x-language-tag") as any
})

export default function ParaglideNextAdapter(props: { children: React.ReactNode }) {
	//we make the client side language provider a sibling of the children
	//That way the entire app isn't turned into a client component
	return (
		<>
			<ClientSideLanguageProvider language={languageTag()} />
			{props.children}
		</>
	)
}
