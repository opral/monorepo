import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("web-icon")
export class WebIcon extends LitElement {
	static override styles = css``
	@property()
	icon: string = ""

	override render() {
		return html` <iconify-icon icon=${this.icon}></iconify-icon> `
	}
}
