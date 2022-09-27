import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("in-button")
export class Button extends LitElement {
	@property()
	class? = "";

	// the button state should be reactive (reflect)
	// otherwise, the `handleClick()` will not reflect the current state
	@property({ reflect: true })
	disabled? = false;

	private handleClick(event: MouseEvent) {
		console.log({ disabled: this.disabled });

		// if the button is disabled, no event should be emitted.
		if (this.disabled) {
			console.log("disabled");
			event.preventDefault();
			event.stopPropagation();
			return;
		}
	}

	render() {
		return html`
			<link rel="stylesheet" href="/tailwind.css"></link>
			<button 
				type="button"
				disabled=${this.disabled === true ? true : nothing}
				aria-disabled=${this.disabled ? "true" : "false"}
				@click=${this.handleClick}
				class="
				${this.class} 
				px-5 py-2.5 mr-2 mb-2 rounded
				disabled:cursor-not-allowed
				">
				<!-- 
					Need to propagate click on slotted childs too.
					Otherwise, clicking elements within the slot either
					does not trigger a click event, or does not disable 
					a click event when this.disabled is true. 
				-->
				<slot @click=${this.handleClick}></slot>
			</button>
		`;
	}
}
