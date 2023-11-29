import { setLanguageTag } from "@/paraglide/runtime"
import { headers } from "next/headers"

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	setLanguageTag(() => {
		return headers().get("x-language-tag") as any
	})

	return children
}
