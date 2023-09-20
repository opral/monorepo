import { Meta, Title } from "@solidjs/meta"
import { Layout } from "#src/pages/Layout.jsx"
import { Show } from "solid-js"
import type { GeneratedTableOfContents as ProcessedTableOfContents } from "./index.page.server.jsx"
import { defaultLanguage } from "#src/renderer/_default.page.route.js"
import { useI18n } from "@solid-primitives/i18n"
import { currentPageContext } from "#src/renderer/state.js"
import "@inlang/markdown/css"
import "@inlang/markdown/custom-elements"

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	processedTableOfContents: ProcessedTableOfContents
	meta: ProcessedTableOfContents[string]
	markdown: Awaited<ReturnType<any>>
}

export function Page(props: PageProps) {
	const [, { locale }] = useI18n()

	const getLocale = () => {
		const language = locale() ?? defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}

	return (
		<>
			{/* frontmatter is undefined on first client side nav  */}
			<Title>
				{
					findPageBySlug(
						currentPageContext.urlParsed.pathname.replace(getLocale(), "").replace("/blog/", ""),
						props.processedTableOfContents,
					)?.title
				}
			</Title>
			<Meta
				name="description"
				content={
					findPageBySlug(
						currentPageContext.urlParsed.pathname.replace(getLocale(), "").replace("/blog/", ""),
						props.processedTableOfContents,
					)?.description
				}
			/>
			<Layout>
				<div class="grid-row-2 py-10 w-full mx-auto ">
					<Show
						when={props.markdown}
						fallback={<p class="text-danger">Parsing markdown went wrong.</p>}
					>
						<div class="mx-auto w-full 7 ml:px-8 justify-self-center">
							{/* eslint-disable-next-line solid/no-innerhtml */}
							<div innerHTML={props.markdown} />
						</div>
					</Show>
					<a class="flex justify-center link link-primary py-4 text-primary " href="/blog">
						&lt;- Back to Blog
					</a>
				</div>
			</Layout>
		</>
	)
}

function findPageBySlug(slug: string, tableOfContents: ProcessedTableOfContents) {
	for (const category of Object.entries(tableOfContents)) {
		if (category[1].href.replace("/blog/", "") === slug) {
			return category[1]
		}
	}
	return undefined
}
