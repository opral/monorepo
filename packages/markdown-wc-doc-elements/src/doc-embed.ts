import { LitElement, css, html } from "lit"
import { Task } from "@lit/task"
import { parse } from "@opral/markdown-wc"
import { unsafeHTML } from "lit/directives/unsafe-html.js"

export default class extends LitElement {
	static override styles = css``

	static override properties = {
		src: { type: String },
	}

	src: string = ""

	private fetchMarkdown = new Task(
		this,
		async ([src]) => {
			if (src === undefined) {
				throw new Error("src is undefined")
			}
			const text = await (await fetch(src)).text()
			console.log(text)
			const parsed = await parse(text)
			console.log(parsed)
			for (const [name, src] of Object.entries(parsed.frontmatter.custom_elements)) {
				if (customElements.get(name) === undefined) {
					const module = await import(src)
					customElements.define(name, module.default)
				}
			}
			return parsed.html
		},
		() => [this.src]
	)

	override render() {
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
