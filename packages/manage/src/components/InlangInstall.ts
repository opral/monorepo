import type { TemplateResult } from "lit"
import { html } from "lit"
import { customElement } from "lit/decorators.js"
import { TwLitElement } from "../common/TwLitElement"

@customElement("inlang-install")
export class InlangInstall extends TwLitElement {
	override render(): TemplateResult {
		return html`<div class="flex flex-col gap-4">Test</div>`
	}
}
