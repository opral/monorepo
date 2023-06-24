import { createResource, Match, onMount, Suspense, Switch } from "solid-js"
import mermaid from "mermaid"
import { getHighlighter, Highlighter, Lang, setCDN } from "shiki"
import copy from "clipboard-copy"
import { showToast } from "@src/components/Toast.jsx"

// importing themes and language colors from a cdn
setCDN("https://cdn.jsdelivr.net/npm/shiki/")

/**
 * Custom fence blocks.
 *
 * Fence blocks are usually code blocks.
 * '''
 * 		those blocks
 * '''
 */
export function Fence(props: { language?: string; content: string }) {
	return (
		<Switch>
			<Match when={props.language === "mermaid"}>
				<MermaidDiagram {...props} />
			</Match>
			<Match when={props.language !== "mermaid"}>
				<SyntaxHighlight {...props} />
			</Match>
		</Switch>
	)
}

const highlighter: Highlighter = await getHighlighter({
	theme: "github-dark-dimmed",
	// preventing layout shift on client side be pre-fecthing
	// js and ts by default.
	langs: ["js", "ts"],
})

function SyntaxHighlight(props: Parameters<typeof Fence>[0]) {
	// dynamically loading syntax highlighting for the specified language.
	const [code] = createResource(async () => {
		if (
			props.language &&
			highlighter.getLoadedLanguages().includes(props.language as Lang) === false
		) {
			await highlighter.loadLanguage(props.language as Lang)
		}
		const code = highlighter.codeToHtml(props.content, {
			lang: props.language,
		})
		return code
	})

	return (
		<Suspense>
			<div class="relative">
				<div
					// eslint-disable-next-line solid/no-innerhtml
					innerHTML={code()}
					class="not-prose p-6 py-4 overflow-auto text-sm rounded-xl"
					style={{ "background-color": highlighter.getBackgroundColor() }}
				/>
				<div
					onClick={() => {
						copy(props.content),
							showToast({ variant: "success", title: "Copy to clipboard", duration: 3000 })
					}}
					class="text-base absolute top-0 right-0 py-2 px-4 text-info hover:text-hover-info cursor-pointer"
				>
					Copy
				</div>
			</div>
		</Suspense>
	)
}

function MermaidDiagram(props: Parameters<typeof Fence>[0]) {
	onMount(() => {
		// @ts-ignore
		mermaid.init()
	})
	return (
		<div class="not-prose py-6 bg-surface-1 rounded">
			<pre class="mermaid flex justify-center">{props.content}</pre>
		</div>
	)
}
