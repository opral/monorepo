import { type Accessor, type Component, createEffect, ErrorBoundary } from "solid-js"
import type { PageContextRenderer } from "./types.js"
import { Dynamic, isServer } from "solid-js/web"
import { LocalStorageProvider } from "#src/services/local-storage/index.js"
import {
	availableLanguageTags,
	onSetLanguageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "#src/paraglide/runtime.js"
import { currentPageContext } from "./state.js"
import type { JSXElement } from "solid-js"
import type { LanguageTag } from "@inlang/sdk"
import Link from "./Link.jsx"
import { WarningIcon } from "#src/pages/@host/@owner/@repository/components/Notification/NotificationHint.jsx"

export type RootProps = Accessor<{
	pageContext: PageContextRenderer
}>

/**
 * The Page that is being rendered.
 *
 * This is the entry point for all pages and acts as a wrapper
 * to provide the page with the required context and provide
 * error boundaries.
 */
export default function Root(props: { page: Component; pageProps: Record<string, unknown> }) {
	return (
		<ErrorBoundary fallback={(error) => <ErrorMessage error={error} />}>
			<ParaglideJsProvider>
				<LocalStorageProvider>
					<Dynamic component={props.page} {...(props.pageProps ?? {})} />
				</LocalStorageProvider>
			</ParaglideJsProvider>
		</ErrorBoundary>
	)
}

function ParaglideJsProvider(props: { children: JSXElement }) {
	setLanguageTag(() => {
		return currentPageContext.languageTag as (typeof availableLanguageTags)[number]
	})

	if (isServer === false && window) {
		// The url contains a language tag for non source language tag routes
		const maybeLanguageTag = window.location.pathname.split("/")[1] as
			| (typeof availableLanguageTags)[number]
			| undefined

		const pathIncludesLanguageTag = maybeLanguageTag
			? availableLanguageTags.includes(maybeLanguageTag)
			: false
		onSetLanguageTag((newLanguageTag: LanguageTag) => {
			if (pathIncludesLanguageTag) {
				//replace old languageTag with new one
				window.location.pathname = window.location.pathname
					.replace(
						currentPageContext.languageTag,
						// if new is source languageTag remove the tag
						newLanguageTag === sourceLanguageTag ? "" : newLanguageTag
					)
					.replace("//", "/")
			} else {
				window.location.pathname = "/" + newLanguageTag + window.location.pathname
			}
		})
	}

	return <>{props.children}</>
}

function ErrorMessage(props: { error: Error }) {
	const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

	createEffect(() => {
		console.error("ERROR in renderer", props.error)
	})
	return (
		<>
			<p class="text-danger text-lg font-medium m-2">ERROR DURING RENDERING</p>
			<p class="text-danger m-2">
				Check the console for more information and please{" "}
				<Link
					class="link text-primary"
					target="_blank"
					href="https://github.com/opral/monorepo/issues/new/choose"
				>
					report the bug.
				</Link>
			</p>
			<p class="bg-danger-container text-on-danger-container rounded p-2 mt-4">
				{props.error?.toString()}
			</p>
			{isSafari && (
				<div class="flex font-mono p-4 bg-surface-800 text-background rounded-md text-sm mt-6 mx-2 w-fit">
					<WarningIcon />
					<span class="ml-2">Safari is not supported, please use a different browser.</span>
				</div>
			)}
		</>
	)
}
