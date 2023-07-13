import { Accessor, Component, createEffect, ErrorBoundary, onMount } from "solid-js"
import type { PageContextRenderer } from "./types.js"
import { Dynamic } from "solid-js/web"
import { LocalStorageProvider, useLocalStorage } from "@src/services/local-storage/index.js"
import { I18nContext, useI18n } from "@solid-primitives/i18n"
import { rpc } from "@inlang/rpc"
import { createI18nContext } from "@solid-primitives/i18n"

export type RootProps = Accessor<{
	pageContext: PageContextRenderer
}>

// get translation files and put it in context provider
const [response] = await rpc.getLangResources()
const value = createI18nContext(response || {}, "en")

console.log(response)

/**
 * The Page that is being rendered.
 *
 * This is the entry point for all pages and acts as wrapper
 * to provide the page with the required context and provide
 * error boundaries.
 */
export function Root(props: {
	page: Component
	pageProps: Record<string, unknown>
	locale: string
}) {
	return (
		<ErrorBoundary fallback={(error) => <ErrorMessage error={error} />}>
			<I18nContext.Provider value={value}>
				<LocalStorageProvider>
					<RootWithProviders page={props.page} pageProps={props.pageProps} locale={props.locale} />
				</LocalStorageProvider>
			</I18nContext.Provider>
		</ErrorBoundary>
	)
}

function RootWithProviders(props: {
	page: Component
	pageProps: Record<string, unknown>
	locale: string
}) {
	const [, setLocalStorage] = useLocalStorage()
	const [, { locale }] = useI18n()

	onMount(() => {
		setLocalStorage({ locale: props.locale })
		locale(props.locale)
	})
	return <Dynamic component={props.page} {...props.pageProps} />
}

function ErrorMessage(props: { error: Error }) {
	createEffect(() => {
		console.error("ERROR in renderer", props.error)
	})
	return (
		<>
			<p class="text-danger text-lg font-medium">ERROR DURING RENDERING</p>
			<p class="text-danger">
				Check the console for more information and please{" "}
				<a
					class="link text-primary"
					target="_blank"
					href="https://github.com/inlang/inlang/issues/new/choose"
				>
					report the bug.
				</a>
			</p>
			<p class="bg-danger-container text-on-danger-container rounded p-2 mt-4">
				{props.error?.toString()}
			</p>
		</>
	)
}
