import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"
import { telemetryBrowser } from "@inlang/telemetry"
@customElement("doc-copy")
export class DocCopy extends LitElement {
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
	@property()
	text: string = "Copy"

	private handleCopy() {
		if (!this.copied) {
			this.text = "Copied!"
			this.copied = true
			// copy to clipboard from the next parent element the innerText
			navigator.clipboard.writeText(this.parentElement?.innerText ?? "")
			telemetryBrowser.capture("WEBSITE copy markdown element", {
				$el_text: this.parentElement?.innerText,
			})

			setTimeout(() => {
				this.text = "Copy"
				this.copied = false
			}, 3000)
		}
	}

	override render() {
		return html` <span @click=${() => this.handleCopy()} class="copy-text"> ${this.text} </span> `
	}
}
