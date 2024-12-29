import { LitElement, css, html } from "lit"
import { Task } from "@lit/task"
import { unsafeHTML } from "lit/directives/unsafe-html.js"
import { parse } from "./parse.js"

console.log("Hello from markdown-wc-embed.ts")

/**
 * A custom element that fetches and embeds markdown wc content.
 *
 * @example
 *   ```html
 *   <embed-markdown-wc src="https://example.com/markdown.md"></embed-markdown-wc>
 *   ```
 */
export default class Element extends LitElement {
	static override styles = css``

	static override properties = {
		src: { type: String },
	}

	src!: string

	private fetchMarkdown = new Task(
		this,
		async ([src]) => {
			if (src === undefined) {
				throw new Error("src is undefined")
			}
			console.log("fetching src:", src)
			const text = await (await fetch(src)).text()
			const parsed = await parse(text)
			for (const src of parsed.frontmatter.imports ?? []) {
				await import(src)
			}
			return parsed.html
		},
		() => [this.src]
	)

	override render() {
		console.log("rendering markdown-wc-embed.ts")
		return html`
			${this.fetchMarkdown.render({
				pending: () => html`<p>Loading...</p>`,
				complete: (markdown) => html`${unsafeHTML(markdown)}`,
				error: (error) => html`
					<p>Error loading markdown.</p>
					<pre>${error}</pre>
				`,
			})}
		`
	}
}

if (typeof customElements !== "undefined" && !customElements.get("markdown-wc-embed")) {
	console.log("defining markdown-wc-embed")
	customElements.define("markdown-wc-embed", Element)
}
