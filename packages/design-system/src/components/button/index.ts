import { html, nothing, LitElement, CSSResultGroup, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { createRef, Ref, ref } from "lit/directives/ref.js";

@customElement("in-button")
export class Button extends LitElement {
	// custom elements are not rendered as inline-block by default.
	// see https://stackoverflow.com/questions/25193964/how-can-i-have-a-web-components-width-and-height-be-inherited-by-its-children
	static styles = css`
		:host {
			display: inline-block;
		}
	`;

	@property()
	class? = "";

	@property()
	disabled? = false;

	render() {
		// enable click with enter key.
		this.buttonRef.value?.addEventListener("keypress", (event) => {
			if (event.key === "Enter") {
				this.buttonRef.value?.click();
			}
		});

		return html`
			<link rel="stylesheet" href="/tailwind.css"></link>
			<button 
				${ref(this.buttonRef)}
				type="button"
				disabled=${this.disabled === true ? true : nothing}
				aria-disabled=${this.disabled ? "true" : "false"}
				@click=${this.handleClick}
				@mousedown=${this.handleMouseDown}
				class="
					${this.class} 
					px-4 py-2.5 mr-2 mb-2 rounded
					flex items-center gap-1.5
					disabled:cursor-not-allowed
				"
			>
				<slot></slot>
			</button>
		`;
	}

	private buttonRef: Ref<HTMLButtonElement> = createRef();

	private handleClick(event: MouseEvent) {
		// if the button is disabled, no event should be emitted.
		if (this.disabled) {
			event.stopPropagation();
			return;
		}
	}

	private handleMouseDown(event: MouseEvent) {
		// prevents the focus state after the button has been clicked.
		// see https://stackoverflow.com/a/37580028
		event.preventDefault();
	}
}
