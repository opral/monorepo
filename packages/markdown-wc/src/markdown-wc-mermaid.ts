import { LitElement, html, css } from "lit"
import mermaid from "mermaid"

export class Element extends LitElement {
	static override styles = css`
		:host {
			display: block;
		}
	`

	/**
	 * Render the mermaid graph as SVG.
	 * @private
	 */
	renderGraph() {
		const content = this.textContent?.trim() || ""
		if (content) {
			mermaid
				.render("graph", content)
				.then((result) => {
					this.shadowRoot!.innerHTML = result.svg
				})
				.catch((error) => {
					this.shadowRoot!.innerHTML = `<pre>${error}</pre>`
				})
		} else {
			this.shadowRoot!.innerHTML = ""
		}
	}

	override connectedCallback() {
		super.connectedCallback()
		this.renderGraph()
	}

	override updated() {
		this.renderGraph()
	}

	override render() {
		return html`<slot></slot>`
	}
}

if (typeof customElements !== "undefined" && !customElements.get("markdown-wc-mermaid")) {
	customElements.define("markdown-wc-mermaid", Element)
}
