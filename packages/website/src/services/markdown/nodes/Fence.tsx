import { createResource, Match, onMount, Suspense, Switch } from "solid-js";
import mermaid from "mermaid";
import { getHighlighter, Highlighter, Lang, setCDN } from "shiki";

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
				<MermaidDiagram {...props}></MermaidDiagram>
			</Match>
			<Match when={props.language !== "mermaid"}>
				<SyntaxHighlight {...props}></SyntaxHighlight>
			</Match>
		</Switch>
	);
}

// importing themes and language colors frmo a cdn client side
if (import.meta.env.SSR === false) {
	setCDN("https://unpkg.com/shiki/");
}
const highlighter: Highlighter = await getHighlighter({
	theme: "dark-plus",
	// preventing layout shift on client side be pre-fecthing
	// js and ts by default.
	langs: ["js", "ts"],
});

function SyntaxHighlight(props: Parameters<typeof Fence>[0]) {
	// dynamically loading syntax highlighting for the specified language.
	const [code] = createResource(async () => {
		if (
			props.language &&
			highlighter.getLoadedLanguages().includes(props.language as Lang) ===
				false
		) {
			await highlighter.loadLanguage(props.language as Lang);
		}
		const code = highlighter.codeToHtml(props.content, {
			lang: props.language,
		});
		return code;
	});

	return (
		<Suspense>
			<div
				innerHTML={code()}
				class="not-prose p-4 rounded overflow-auto text-sm"
				style={{ "background-color": highlighter.getBackgroundColor() }}
			></div>
		</Suspense>
	);
}

function MermaidDiagram(props: Parameters<typeof Fence>[0]) {
	onMount(() => {
		// @ts-ignore
		mermaid.init();
	});
	return (
		<div class="not-prose py-6 bg-surface-1 rounded">
			<pre class="mermaid flex justify-center">{props.content}</pre>
		</div>
	);
}
