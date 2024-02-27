import type { AppProps } from "next/app"
import { ParaglideJS } from "@inlang/paraglide-js-adapter-next/pages"

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ParaglideJS>
			<Component {...pageProps} />
		</ParaglideJS>
	)
}
