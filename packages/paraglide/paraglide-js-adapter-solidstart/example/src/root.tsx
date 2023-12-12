// @refresh reload
import { Component, ErrorBoundary, Suspense } from "solid-js"
import { Body, FileRoutes, Head, Html, Routes, Scripts } from "solid-start"
import * as i18n from "./i18n"

const Root: Component = () => {
	const url_language_tag = i18n.getLanguageTagFromURL()
	const language_tag = url_language_tag ?? i18n.sourceLanguageTag

	return (
		<i18n.LanguageTagProvider value={language_tag}>
			<Html lang={language_tag}>
				<Head />
				<Body>
					<ErrorBoundary fallback={<></>}>
						<Suspense fallback={<></>}>
							<Routes base={url_language_tag}>
								<FileRoutes />
							</Routes>
						</Suspense>
					</ErrorBoundary>
					<Scripts />
				</Body>
			</Html>
		</i18n.LanguageTagProvider>
	)
}
export default Root
