import { getHighlighter } from "shiki";

const highlighter = await getHighlighter({ theme: "dark-plus" });

/**
 * Custom fence blocks.
 *
 * Fence blocks are usually code blocks.
 * '''
 * 		those blocks
 * '''
 */
export function Fence(props: { language?: string; content: string }) {
	const code = highlighter.codeToHtml(props.content, {
		lang: props.language,
	});
	return <div innerHTML={code}></div>;
}
