import { Link as MetaLink, Meta, Title } from "@solidjs/meta";
import { Show, onMount } from "solid-js";
import { languageTag } from "#src/paraglide/runtime.js";
import { currentPageContext } from "#src/renderer/state.js";
import tableOfContentsRaw from "../../../../../../blog/tableOfContents.json?raw";
import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx";
import Link from "#src/renderer/Link.jsx";
import { i18nRouting } from "#src/services/i18n/routing.js";

const tableOfContents = JSON.parse(tableOfContentsRaw);

/**
 * The page props are undefined if an error occurred during parsing of the markdown.
 */
export type PageProps = {
	markdown: Awaited<ReturnType<any>>;
};

export default function Page(props: PageProps) {
	const replaceChars = (str: string) => {
		return str
			.replaceAll(" ", "-")
			.replaceAll("/", "")
			.replace("#", "")
			.replaceAll("(", "")
			.replaceAll(")", "")
			.replaceAll("?", "")
			.replaceAll(".", "")
			.replaceAll("@", "")
			.replaceAll(
				/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
				""
			)
			.replaceAll("✂", "");
	};

	const scrollToAnchor = (anchor: string, behavior?: ScrollBehavior) => {
		const element = document.getElementById(anchor);
		if (element && window) {
			window.scrollTo({
				top: element.offsetTop - 96,
				behavior: behavior ?? "instant",
			});
		}
		window.history.pushState(
			{},
			"",
			`${currentPageContext.urlParsed.pathname}#${anchor}`
		);
	};

	onMount(async () => {
		for (const heading of props.markdown
			.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g)
			.map((heading: string) => {
				// We have to use DOMParser to parse the heading string to a HTML element
				const parser = new DOMParser();
				const doc = parser.parseFromString(heading, "text/html");
				const node = doc.body.firstChild as HTMLElement;

				return node.innerText.replace(/(<([^>]+)>)/gi, "").toString();
			})) {
			if (
				currentPageContext.urlParsed.hash?.replace("#", "").toString() ===
				replaceChars(heading.toString().toLowerCase())
			) {
				/* Wait for all images to load before scrolling to anchor */
				await Promise.all(
					[...document.querySelectorAll("img")].map((img) =>
						img.complete
							? Promise.resolve()
							: new Promise((resolve) => img.addEventListener("load", resolve))
					)
				);

				scrollToAnchor(
					replaceChars(heading.toString().toLowerCase()),
					"smooth"
				);
			}
		}
	});

	return (
		<>
			{/* frontmatter is undefined on first client side nav  */}
			<Title>
				{
					findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace("/" + languageTag(), "")
							.replace("/blog/", ""),
						tableOfContents
					)?.title
				}
			</Title>
			<Meta
				name="description"
				content={
					findPageBySlug(
						currentPageContext.urlParsed.pathname
							.replace("/" + languageTag(), "")
							.replace("/blog/", ""),
						tableOfContents
					)?.description
				}
			/>
			<MetaLink
				href={`https://inlang.com${i18nRouting(currentPageContext.urlParsed.pathname).url}`}
				rel="canonical"
			/>
			<MarketplaceLayout>
				<div class="grid-row-2 py-10 w-full mx-auto ">
					<Show
						when={props.markdown}
						fallback={<p class="text-danger">Parsing markdown went wrong.</p>}
					>
						<div class="mx-auto w-full 7 ml:px-8 justify-self-center">
							<Markdown markdown={props.markdown} />
						</div>
					</Show>
					<Link
						class="flex justify-center link link-primary py-4 text-primary "
						href="/blog"
					>
						&lt;- Back to Blog
					</Link>
				</div>
			</MarketplaceLayout>
		</>
	);
}

function Markdown(props: { markdown: string }) {
	return (
                <article
                        class="pt-24 pb-24 md:pt-10 prose w-full mx-auto max-w-3xl prose-code:py-0.5 prose-code:px-1 prose-code:bg-secondary-container prose-code:text-on-secondary-container prose-code:font-medium prose-code:rounded prose-code:before:hidden prose-code:after:hidden prose-p:text-base prose-sm prose-slate prose-li:py-1 prose-li:text-base prose-headings:font-semibold prose-headings:text-active-info prose-p:leading-7 prose-p:opacity-90 prose-h1:text-4xl prose-h2:text-2xl prose-h2:border-t prose-h2:border-surface-3 prose-h2:pt-8 prose-h2:pb-4 prose-h3:text-[19px] prose-h3:pb-2 prose-table:text-base"
                        // eslint-disable-next-line solid/no-innerhtml
                        innerHTML={props.markdown}
                />
        );
}

function findPageBySlug(slug: string, tableOfContents: any[]) {
	const description = tableOfContents.find(
		(content: Record<string, string>) => content.slug === slug
	);

	if (description) {
		return description;
	} else {
		return undefined;
	}
}
