import { Header } from "@/lib/Header"
import { AvailableLanguageTag, setLanguageTag } from "@/paraglide/runtime"
import type { AppProps } from "next/app"

export default function App({ Component, pageProps, router }: AppProps) {
	setLanguageTag(router.locale as AvailableLanguageTag)
	return (
		<>
			<Header />
			<Component {...pageProps} />
		</>
	)
}
