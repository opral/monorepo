import { html, nothing, LitElement, CSSResultGroup, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("in-alert")
export class Alert extends LitElement {
	// custom elements are not rendered as inline-block by default.
	// see https://stackoverflow.com/questions/25193964/how-can-i-have-a-web-components-width-and-height-be-inherited-by-its-children
	static styles = css`
		:host {
			display: inline-block;
		}
	`;

	@property()
	class? = "";

	render() {
		return html`
			<link rel="stylesheet" href="/tailwind.css"></link>
			<div class="${this.class} p-4 border rounded flex gap-2" role="alert">
				<slot></slot>
			</div>
		`;
	}
}
