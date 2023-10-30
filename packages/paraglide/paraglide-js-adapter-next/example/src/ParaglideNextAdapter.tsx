import { setLanguageTag } from "@inlang/paraglide-js/inlang-marketplace"
import { headers } from "next/headers"

setLanguageTag(() => {
	return headers().get("x-language-tag") as any
})

export default function ParaglideNextAdapter(props: { children: React.ReactNode }) {
	return <>{props.children}</>
}
