import {
	Accessor,
	Component,
	createEffect,
	createSignal,
	ErrorBoundary,
	onMount,
	Show,
} from "solid-js"
import type { PageContextRenderer } from "./types.js"
import { Dynamic } from "solid-js/web"
import { LocalStorageProvider } from "#src/services/local-storage/index.js"
import { I18nContext, useI18n } from "@solid-primitives/i18n"
import { createI18nContext } from "@solid-primitives/i18n"

// manually import the translations via vite's file resolver
import de from "../../lang/de.json?raw"
import en from "../../lang/en.json?raw"
import zh from "../../lang/zh.json?raw"

export type RootProps = Accessor<{
	pageContext: PageContextRenderer
}>

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
	isEditor: boolean
}) {
	const i18nvalue = createI18nContext(
		{
			de: JSON.parse(de),
			en: JSON.parse(en),
			zh: JSON.parse(zh),
		},
		"en",
	)

	return (
		<ErrorBoundary fallback={(error) => <ErrorMessage error={error} />}>
			<I18nContext.Provider value={i18nvalue}>
				<LocalStorageProvider>
					<RootWithProviders
						page={props.page}
						pageProps={props.pageProps}
						locale={props.locale}
						isEditor={props.isEditor}
					/>
				</LocalStorageProvider>
			</I18nContext.Provider>
		</ErrorBoundary>
	)
}

// This signal is used to render the rest of the content after fetching locales data
export const [localesLoaded, setLocalesLoaded] = createSignal(false)

function RootWithProviders(props: {
	page: Component
	pageProps: Record<string, unknown>
	locale: string
	isEditor: boolean
}) {
	const [, { locale }] = useI18n()

	onMount(() => {
		locale(props.locale)
		setLocalesLoaded(true)
	})

	return (
		<>
			{/* Render the rest of the content after fetching locales data */}
			<Show when={localesLoaded() && props.isEditor}>
				<Dynamic component={props.page} {...props.pageProps} />
			</Show>
			{/* Render differently if it isn't the Editor */}
			<Show when={!props.isEditor && props.pageProps !== undefined}>
				<Dynamic component={props.page} {...props.pageProps} />
			</Show>
		</>
	)
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
