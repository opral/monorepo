import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("doc-icon")
export default class extends LitElement {
	static override styles = css`
		:host {
			display: inline-flex;
			height: auto;
		}
	`
	@property()
	icon: string = ""
	@property()
	size: string = ""

	override render() {
		return html` <iconify-icon height=${this.size} icon=${this.icon}></iconify-icon> `
	}
}
