import { html, LitElement, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { baseStyling } from "../styling/base.js";

import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.component.js";
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js";
import SlAvatar from "@shoelace-style/shoelace/dist/components/avatar/avatar.component.js";

import type { MarketplaceManifest } from "@inlang/marketplace-manifest";

// in case an app defines it's own set of shoelace components, prevent double registering
if (!customElements.get("sl-menu")) customElements.define("sl-menu", SlMenu);
if (!customElements.get("sl-menu-item"))
  customElements.define("sl-menu-item", SlMenuItem);
if (!customElements.get("sl-avatar"))
  customElements.define("sl-avatar", SlAvatar);

@customElement("inlang-doc-navigation")
export default class InlangDocNavigation extends LitElement {
  static override styles = [
    baseStyling,
    css`
      .container {
        padding-right: 24px;
        display: flex;
        flex-direction: column;
        padding-top: 20px;
        gap: 32px;
      }
      .menu-list {
        margin-left: -12px;
        padding: 0;
        background-color: transparent;
        border: none;
        display: flex;
        flex-direction: column;
      }
      .menu-namespace {
        display: flex;
        align-items: center;
        height: 34px;
        padding-left: 12px;
        padding-right: 12px;
        color: var(--sl-color-neutral-950);
        font-size: 14px;
        text-transform: capitalize;
        font-weight: 600;
      }
      .menu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 34px;
        padding-left: 12px;
        padding-right: 12px;
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
      .link-indicator {
        width: 14px;
        height: 14px;
        color: var(--sl-color-neutral-400);
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
      .space {
        width: 100%;
        height: 24px;
      }
    `,
  ];

  @property({ type: Object })
  manifest: MarketplaceManifest & { uniqueID: string } =
    {} as MarketplaceManifest & {
      uniqueID: string;
    };

  @property({ type: Object })
  currentRoute: string = "/";

  private get _displayName(): string | undefined {
    if (typeof this.manifest.displayName === "object") {
      return this.manifest.displayName.en;
    } else {
      return this.manifest.displayName;
    }
  }

  private get _basePath(): string | undefined {
    if (this.manifest.slug) {
      return `/m/${this.manifest.uniqueID}/${this.manifest.slug}`;
    } else {
      return `/m/${this.manifest.uniqueID}/${this.manifest.id.replaceAll(".", "-")}`;
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
            ${Object.entries(this.manifest.pages).map(([key, value]) => {
              if (typeof value === "string") {
                const route = key;
                const navTitle = route.split("/").pop();

                return html`<a
                  class=${`menu-item ${this.currentRoute === route && "menu-item-selected"}`}
                  href=${this._basePath + route}
                  >${navTitle
                    ? navTitle.replaceAll("-", " ")
                    : "Introduction"}</a
                >`;
              } else {
                return html` <div class="menu-namespace">${key}</div>
                  ${Object.entries(value).map(([route, path]) => {
                    const navTitle = route.split("/").pop();
                    const isLink =
                      (path as string).endsWith(".md") ||
                      (path as string).endsWith(".html")
                        ? false
                        : true;
                    return html`<a
                      class=${`menu-item ${this.currentRoute === route && "menu-item-selected"}`}
                      href=${isLink ? path : this._basePath + route}
                      >${navTitle
                        ? navTitle.replaceAll("-", " ")
                        : "Introduction"}
                      ${isLink &&
                      html`<div class="link-indicator">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="100%"
                          height="100%"
                          fill="none"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fill="currentColor"
                            d="M15.716 8.433l-5.759 5.784a.96.96 0 01-1.64-.683c0-.256.1-.501.28-.683l4.12-4.136H.96A.958.958 0 010 7.751a.966.966 0 01.96-.964h11.758L8.599 2.648A.968.968 0 019.28 1c.255 0 .5.102.68.283l5.76 5.784a.963.963 0 01.207 1.053.965.965 0 01-.21.313z"
                          />
                        </svg>
                      </div> `}</a
                    > `;
                  })}
                  <div class="space"></div>`;
              }
            })}
          </div>`
        : ``}
    </div>`;
  }
}

// add types
declare global {
  interface HTMLElementTagNameMap {
    "inlang-doc-navigation": InlangDocNavigation;
  }
}
