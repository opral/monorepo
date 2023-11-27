// Components
import type { TemplateResult } from "lit"
import { html } from "lit"
import { customElement } from "lit/decorators.js"
import { TwLitElement } from "../common/TwLitElement"

import "../components/InlangManage"

@customElement("x-index-page")
export class IndexPage extends TwLitElement {
	override render(): TemplateResult {
		return html`
			<div class="container">
				<x-hello-world></x-hello-world>
				<inlang-manage></inlang-manage>
			</div>
		`
	}
}
