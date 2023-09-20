import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("web-icon")
export class WebIcon extends LitElement {
	static override styles = css`
        :host {
            display: inline-flex;
            height: auto;
    `
	@property()
	icon: string = ""

	override render() {
		return html` <iconify-icon height="1.7em" icon=${this.icon}></iconify-icon> `
	}
}
