import { html, LitElement, css } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import overridePrimitiveColors from "./../helper/overridePrimitiveColors.js"

@customElement("inlang-doc-layout")
export default class InlangDocLayout extends LitElement {
	static override styles = [baseStyling, css``]

	@property({ type: Object })
	manifest: MarketplaceManifest = {} as MarketplaceManifest

	override async firstUpdated() {
		await this.updateComplete

		//override primitive colors to match the design system
		overridePrimitiveColors()
	}

	override render() {
		return html` <div class="container" part="base">
			<p>${this.manifest.id}</p>
			<slot></slot>
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-doc-layout": InlangDocLayout
	}
}
