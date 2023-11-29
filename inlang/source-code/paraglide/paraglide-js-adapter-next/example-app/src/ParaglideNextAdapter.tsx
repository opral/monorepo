import { languageTag, setLanguageTag } from "@/paraglide/runtime"
import { headers } from "next/headers"
import { LanguageProvider } from "./LanguageProvider"

setLanguageTag(() => {
	return headers().get("x-language-tag") as any
})

export default function ParaglideNextAdapter(props: { children: React.ReactNode }) {
	return (
		<>
			<LanguageProvider language={languageTag()} />
			{props.children}
		</>
	)
}
