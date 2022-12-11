import shiki from "shiki";

const highlighter = await shiki.getHighlighter({ theme: "dark-plus" });

export function SyntaxHighlight(props: { language?: string; content: string }) {
	const code = highlighter.codeToHtml(props.content, {
		lang: props.language,
	});
	return <div innerHTML={code}></div>;
}
