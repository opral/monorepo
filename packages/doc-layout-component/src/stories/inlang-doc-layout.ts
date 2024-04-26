import { html, LitElement, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import overridePrimitiveColors from "./../helper/overridePrimitiveColors.js"

import SlDrawer from "@shoelace-style/shoelace/dist/components/drawer/drawer.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-drawer")) customElements.define("sl-drawer", SlDrawer)
if (!customElements.get("sl-button")) customElements.define("sl-button", SlButton)

@customElement("inlang-doc-layout")
export default class InlangDocLayout extends LitElement {
	static override styles = [
		baseStyling,
		css`
			.container {
				display: flex;
				width: 100%;
				height: 100%;
			}
			.right-column {
				width: 230px;
				height: 100%;
				background-color: var(--sl-color-neutral-50);
			}
			.main-column {
				flex-grow: 1;
				position: relative;
				height: 100%;
				background-color: var(--sl-color-neutral-100);
			}
			.left-column {
				width: 230px;
				height: 100%;
				background-color: var(--sl-color-neutral-50);
			}
			.open-menu-button {
				display: none;
			}
			@media (max-width: 1280px) {
				.right-column {
					display: none;
				}
			}
			@media (max-width: 768px) {
				.left-column {
					display: none;
				}
				.open-menu-button {
					display: block;
					position: absolute;
					top: 10px;
					right: 10px;
				}
			}
		`,
	]

	@property({ type: Object })
	manifest: MarketplaceManifest = {} as MarketplaceManifest

	@state()
	private _drawerIsOpen: boolean = false

	override async firstUpdated() {
		await this.updateComplete

		//override primitive colors to match the design system
		overridePrimitiveColors()
	}

	override render() {
		return html`<div class="container" part="base">
			<div class="left-column">${this.manifest.id}</div>
			<div class="main-column">
				<div class="open-menu-button">
					<sl-button @click=${() => (this._drawerIsOpen = true)}>Open</sl-button>
				</div>
				<slot></slot>
			</div>
			<div class="right-column">right</div>
			<sl-drawer
				label="Navigation right"
				.open=${this._drawerIsOpen}
				@sl-after-hide=${() => {
					this._drawerIsOpen = false
				}}
			>
				right
			</sl-drawer>
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-doc-layout": InlangDocLayout
	}
}
