import { LitElement, css, html } from "lit"

export default class Element extends LitElement {
	static override styles = css`
		.copy-text {
			color: #64748b;
			display: inline-block;
			cursor: pointer;
			transition: all 0.2s ease-in-out;
		}
		.copy-text:hover {
			color: #7689a6;
		}
	`

	private copied = false

	static override properties = {
		text: { type: String },
	}

	text: string = "Copy"

	private handleCopy() {
		if (!this.copied) {
			this.text = "Copied!"
			this.copied = true
			// copy to clipboard from the next parent element the innerText
			navigator.clipboard.writeText(this.parentElement?.innerText ?? "")

			// TODO automatic re-rendering is not working. manual re-rendering is needed
			this.requestUpdate()

			setTimeout(() => {
				this.text = "Copy"
				this.copied = false
				// TODO automatic re-rendering is not working. manual re-rendering is needed
				this.requestUpdate()
			}, 3000)
		}
	}

	override render() {
		return html` <span @click=${() => this.handleCopy()} class="copy-text"> ${this.text} </span> `
	}
}

if (typeof customElements !== "undefined" && !customElements.get("doc-copy")) {
	customElements.define("doc-copy", Element)
}
