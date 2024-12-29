import { LitElement, css, html } from "lit"
import { property } from "lit/decorators.js"

export default class extends LitElement {
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
