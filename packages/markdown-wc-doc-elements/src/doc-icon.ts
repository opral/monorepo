import { LitElement, css, html } from "lit"

export default class Element extends LitElement {
	static override styles = css`
		:host {
			display: inline-flex;
			height: auto;
		}
	`
	static override properties = {
		icon: { type: String },
		size: { type: String },
	}

	icon: string = ""
	size: string = ""

	override render() {
		return html` <iconify-icon height=${this.size} icon=${this.icon}></iconify-icon> `
	}
}

if (typeof customElements !== "undefined" && !customElements.get("doc-icon")) {
	customElements.define("doc-icon", Element)
}
