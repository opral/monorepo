import type { AppProps } from "next/app"
import { ParaglideJS } from "@inlang/paraglide-js-adapter-next"

export default function App({ Component, pageProps, router }: AppProps) {
	return (
		<ParaglideJS language={router.locale}>
			<Component {...pageProps} />
		</ParaglideJS>
	)
}
