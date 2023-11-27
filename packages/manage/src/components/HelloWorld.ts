import type { TemplateResult } from "lit"
import { html } from "lit"
import { customElement } from "lit/decorators.js"
import { TwLitElement } from "../common/TwLitElement"

@customElement("x-hello-world")
export class HelloWorld extends TwLitElement {
	override render(): TemplateResult {
		return html` <button class="text-4xl mx-auto text-green-500">Hello world!</button> `
	}
}
