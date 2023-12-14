// Components
import type { TemplateResult } from "lit"
import { html } from "lit"
import { customElement } from "lit/decorators.js"
import { TwLitElement } from "../common/TwLitElement.js"
import "@inlang/markdown/custom-elements"

import "../components/InlangManage"

@customElement("x-index-page")
export class IndexPage extends TwLitElement {
	override render(): TemplateResult {
		return html`
			<div class="container">
				<inlang-manage></inlang-manage>
			</div>
		`
	}
}
