import { LitElement, css, html } from "lit"
import { property } from "lit/decorators.js"

export default class extends LitElement {
	static override styles = css`
		:host {
			display: inline-flex;
			width: 100%;
			height: auto;
		}
		.doc-image {
			width: 100%;
			height: auto;
		}
	`
	@property()
	src: string = ""
	@property()
	alt: string = ""

	override render() {
		return html` <img class="doc-image" src=${this.src} alt=${this.alt} /> `
	}
}
