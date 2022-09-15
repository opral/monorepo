import { html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { LitElementWithTailwindCss } from "./utilities/LitElementWithTailwindCss.js";

@customElement("in-button")
export class Button extends LitElementWithTailwindCss {
	@property()
	name = "Somebody";

	render() {
		return html`
			<div class="w-10 h-10 bg-primary"></div>
			<div class="w-10 h-10 bg-secondary"></div>
			<div class="w-10 h-10 bg-tertiary"></div>
			<h1 class="display-md">Display MD</h1>
			<h3 class="headline-md">Headline MD</h3>
			<h2 class="title-md">Title MD</h2>
			<p class="body-md">Body MD</p>
			<p class="label-md">Label MD</p>
			<span class="material-symbols-rounded"> search </span>
			<p class="title-lg">
				Search inbox
				<span class="material-symbols-rounded title-lg"> search </span>
			</p>
		`;
	}
}
