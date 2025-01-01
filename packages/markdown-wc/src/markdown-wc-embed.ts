import { LitElement, html } from "lit"
import { Task } from "@lit/task"
import { unsafeHTML } from "lit/directives/unsafe-html.js"
import { parse } from "./parse.js"

/**
 * A custom element that fetches and embeds markdown wc content.
 *
 * @example
 *   ```html
 *   <markdown-wc-embed base="/foo">
 *     <markdown-wc-embed src="./hello"></markdown-wc-embed>
 *   </markdown-wc-embed>
 *   ```
 */
export default class Element extends LitElement {
	static override properties = {
		src: { type: String },
		base: { type: String }, // Base path to propagate
	}

	src?: string
	base?: string

	private fetchMarkdown = new Task(
		this,
		async ([src, base]) => {
			if (src === undefined) {
				throw new Error("src is undefined")
			}

			// Resolve the full URL using the base path, if provided
			const resolvedSrc = base ? resolveUrl(src, base) : src

			const text = await (await fetch(resolvedSrc)).text()
			const parsed = await parse(text)

			for (const importSrc of parsed.frontmatter.imports ?? []) {
				const resolvedImportSrc = resolveUrl(importSrc, resolvedSrc)
				await import(resolvedImportSrc)
			}

			return this.base
				? // prefix the html with the base path for child elements to inherit
					`<!--mwc-base=${this.base}-->` + parsed.html
				: parsed.html
		},
		() => [this.src, this.base] // React to changes in src or base
	)

	/**
	 * Applies styles defined in the light DOM `<style>` element to the shadow DOM.
	 */
	private applyLightDomStyles() {
		const styleElement = this.querySelector("style")
		if (styleElement) {
			const userStyles = document.createElement("style")
			userStyles.textContent = styleElement.textContent
			this.shadowRoot?.appendChild(userStyles)
		}
	}

	override connectedCallback() {
		super.connectedCallback()
		this.applyLightDomStyles()
		if (!this.base) {
			this.inheritBaseFromParent()
		}
	}

	/**
	 * Inherit the `base` value from the nearest parent's HTML comment.
	 */
	private inheritBaseFromParent() {
		const root: DocumentFragment | null = this.getRootNode() as DocumentFragment

		root.childNodes.forEach((node) => {
			if (node.nodeType === Node.COMMENT_NODE) {
				const match = node.nodeValue?.match(/mwc-base=(.*?)/)
				if (match && this.base === undefined) {
					this.base = node.nodeValue!.split("=")[1]
					return
				}
			}
		})
	}

	override render() {
		return html`
			${this.fetchMarkdown.render({
				pending: () => html`<p>Loading...</p>`,
				complete: (markdown) => html` ${unsafeHTML(markdown)} `,
				error: (error) => html`
					<p>Error loading markdown.</p>
					<pre>${error}</pre>
				`,
			})}
		`
	}
}

/**
 * Resolves a relative URL against a base URL, handling relative paths.
 * @param {string} relativePath - The relative path to resolve.
 * @param {string} basePath - The base path to resolve against.
 * @returns {string} - The resolved URL.
 */
function resolveUrl(relativePath: string, basePath: string): string {
	// If basePath is not absolute, use document.baseURI as the absolute base
	const absoluteBase =
		basePath.startsWith("http://") || basePath.startsWith("https://") || basePath.startsWith("/")
			? basePath
			: new URL(basePath, document.baseURI).href

	// Resolve the relative path
	return new URL(relativePath, absoluteBase).href
}

if (typeof customElements !== "undefined" && !customElements.get("markdown-wc-embed")) {
	customElements.define("markdown-wc-embed", Element)
}
