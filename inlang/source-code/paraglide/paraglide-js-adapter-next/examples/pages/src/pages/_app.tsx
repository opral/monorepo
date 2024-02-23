import type { AppProps } from "next/app"
import { ParaglideJS } from "@inlang/paraglide-js-adapter-next/pages"
import * as runtime from "@/paraglide/runtime.js"

export default function App({ Component, pageProps, router }: AppProps) {
	return (
		<ParaglideJS runtime={runtime} language={router.locale}>
			<Component {...pageProps} />
		</ParaglideJS>
	)
}
