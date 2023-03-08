import { Accessor, Component, createEffect, ErrorBoundary } from "solid-js"
import type { PageContextRenderer } from "./types.js"
import { Dynamic } from "solid-js/web"
import { LocalStorageProvider } from "@src/services/local-storage/index.js"

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
export function Root(props: { page: Component; pageProps: Record<string, unknown> }) {
	return (
		<ErrorBoundary fallback={(error) => <ErrorMessage error={error} />}>
			<LocalStorageProvider>
				<Dynamic component={props.page} {...props.pageProps} />
			</LocalStorageProvider>
		</ErrorBoundary>
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
