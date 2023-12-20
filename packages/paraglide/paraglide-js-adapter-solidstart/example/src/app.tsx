// @refresh reload
import { Router } from "@solidjs/router"
import { FileRoutes } from "@solidjs/start"
import { Component, Suspense } from "solid-js"
import * as i18n from "./i18n"

const App: Component = () => {
	const url_language_tag = i18n.useLocationLanguageTag()
	const language_tag = url_language_tag ?? i18n.sourceLanguageTag

	return (
		<main>
			<Router
				base={url_language_tag}
				root={(props) => (
					<i18n.LanguageTagProvider value={language_tag}>
						<Suspense>{props.children}</Suspense>
					</i18n.LanguageTagProvider>
				)}
			>
				<FileRoutes />
			</Router>
		</main>
	)
}
export default App
