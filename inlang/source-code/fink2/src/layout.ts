import { customElement, state } from "lit/decorators.js"
import { BaseElement } from "./baseElement.js"
import { html, type TemplateResult } from "lit"

@customElement("fink-layout")
export class Layout extends BaseElement {
	render() {
		return html`
			<div class="bg-red-200 p-6">
				<slot> </slot>
			</div>
		`
	}
}

export const IndexLayout = (children: TemplateResult) => html`
	<div class="bg-red-200 p-6">${children}</div>
`
