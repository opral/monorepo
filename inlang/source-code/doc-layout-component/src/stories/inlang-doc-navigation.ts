import { html, LitElement, css } from "lit"
import { customElement, property } from "lit/decorators.js"
import { baseStyling } from "../styling/base.js"

import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.component.js"
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js"
import SlAvatar from "@shoelace-style/shoelace/dist/components/avatar/avatar.component.js"

import type { MarketplaceManifest } from "@inlang/marketplace-manifest"

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-menu")) customElements.define("sl-menu", SlMenu)
if (!customElements.get("sl-menu-item")) customElements.define("sl-menu-item", SlMenuItem)
if (!customElements.get("sl-avatar")) customElements.define("sl-avatar", SlAvatar)

@customElement("inlang-doc-navigation")
export default class InlangDocNavigation extends LitElement {
	static override styles = [
		baseStyling,
		css`
			.container {
				padding-right: 24px;
				display: flex;
				flex-direction: column;
				gap: 32px;
				padding-top: 20px;
			}
			.menu-list {
				margin-left: -10px;
				padding: 0;
				background-color: transparent;
				border: none;
				display: flex;
				flex-direction: column;
			}
			.menu-item {
				display: flex;
				align-items: center;
				height: 34px;
				padding-left: 16px;
				padding-right: 16px;
				border-radius: 6px;
				background-color: transparent;
				color: var(--sl-color-neutral-600);
				font-size: 14px;
				text-decoration: none;
				text-transform: capitalize;
			}
			.menu-item:hover {
				background-color: var(--sl-color-neutral-100);
				color: var(--sl-color-neutral-950);
			}
			.menu-item-selected {
				background-color: var(--sl-color-primary-100);
				color: var(--sl-color-primary-700);
				font-weight: 600;
			}

			sl-avatar {
				--size: 30px;
			}
			.productTitle {
				font-size: 16px;
				font-weight: 700;
				margin: 0;
			}
			.author {
				font-size: 14px;
				margin: 0;
				color: var(--sl-color-neutral-500);
			}
			.productImage {
				width: 36px;
				height: 36px;
				margin-bottom: 12px;
			}
			.product-container {
				display: flex;
				gap: 2px;
				flex-direction: column;
			}
		`,
	]

	@property({ type: Object })
	manifest: MarketplaceManifest & { uniqueID: string } = {} as MarketplaceManifest & {
		uniqueID: string
	}

	@property({ type: Object })
	currentRoute: string = "/"

	private get _displayName(): string | undefined {
		if (typeof this.manifest.displayName === "object") {
			return this.manifest.displayName.en
		} else {
			return this.manifest.displayName
		}
	}

	private get _basePath(): string | undefined {
		if (this.manifest.slug) {
			return `/m/${this.manifest.uniqueID}/${this.manifest.slug}`
		} else {
			return `/m/${this.manifest.uniqueID}/${this.manifest.id.replaceAll(".", "-")}`
		}
	}

	override render() {
		return html`<div class="container" part="base">
			<div class="product-container">
				<img class="productImage" src=${this.manifest.icon} />
				<p class="productTitle">${this._displayName}</p>
				<p class="author">by ${this.manifest.publisherName}</p>
			</div>
			${this.manifest.pages
				? html`<div class=${`menu-list`}>
						${Object.keys(this.manifest.pages).map((route) => {
							const navTitle = route.split("/").pop()

							return html`<a
								class=${`menu-item ${this.currentRoute === route && "menu-item-selected"}`}
								href=${this._basePath + route}
								>${navTitle ? navTitle.replaceAll("-", " ") : "Introduction"}</a
							>`
						})}
				  </div>`
				: ``}
		</div>`
	}
}

// add types
declare global {
	interface HTMLElementTagNameMap {
		"inlang-doc-navigation": InlangDocNavigation
	}
}
