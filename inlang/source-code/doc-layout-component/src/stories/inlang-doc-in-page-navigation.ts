import { html, LitElement, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
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

type Headlines = {
  level: "H1" | "H2" | "H3";
  anchor: string;
  element: Element;
}[];

@customElement("inlang-doc-in-page-navigation")
export default class InlangDocInPageNavigation extends LitElement {
  static override styles = [
    baseStyling,
    css`
      .container {
        font-size: 14px;
        font-weight: 600;
        padding-top: 20px;
      }
      .list {
        display: flex;
        flex-direction: column;
        margin-top: 8px;
      }
      .link {
        text-decoration: none;
        color: var(--sl-color-neutral-600);
        font-size: 14px;
        padding: 5px 0;
        font-weight: 400;
      }
      .link-container {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--sl-color-neutral-600);
      }
      .link:hover {
        color: var(--sl-color-primary-600);
      }
      .separator {
        height: 1px;
        width: 100%;
        background-color: var(--sl-color-neutral-200);
        margin: 16px 0;
      }
      .h1 {
        margin-left: 0;
      }
      .h2 {
        margin-left: 16px;
      }
      .h3 {
        margin-left: 32px;
      }
    `,
  ];

  @property({ type: Object })
  manifest: MarketplaceManifest & { uniqueID: string } =
    {} as MarketplaceManifest & {
      uniqueID: string;
    };

  @property({ type: Array })
  contentInHtml: HTMLCollection | undefined;

  @state()
  private _headlines: Headlines = [];

  private _replaceChars = (str: string) => {
    return str
      .replaceAll(" ", "-")
      .replaceAll("/", "")
      .replace("#", "")
      .replaceAll("(", "")
      .replaceAll(")", "")
      .replaceAll("?", "")
      .replaceAll(".", "")
      .replaceAll("@", "")
      .replaceAll(
        /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
        "",
      )
      .replaceAll("✂", "")
      .replaceAll(":", "");
  };

  private _findHeadlineElements = (elements: HTMLCollection) => {
    const headers: Headlines = [];

    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      // Check if the element is an h1 or h2
      if (
        element &&
        element.textContent &&
        (element.tagName === "H1" ||
          element.tagName === "H2" ||
          element.tagName === "H3")
      ) {
        // Add the element to the headers array
        const id = this._replaceChars(element.textContent.toLowerCase());
        headers.push({ level: element.tagName, anchor: id, element: element });
      }
    }

    // Return the array of h1 and h2 elements
    return headers;
  };

  _doesH1Exist = (headlines: Headlines) => {
    return headlines.some((headline) => headline.level === "H1");
  };

  override async firstUpdated() {
    if (this.contentInHtml) {
      this._headlines = this._findHeadlineElements(this.contentInHtml);
    }
  }

  override render() {
    return html`<div class="container" part="base">
      On this page
      <div class="list">
        ${this._headlines.map((headline) => {
          if (headline.level === "H1") {
            return html`<a class=${`link h1`} href="#${headline.anchor}"
              >${headline.element.textContent}</a
            >`;
          } else if (headline.level === "H2") {
            return html`<a
              class=${`link ${this._doesH1Exist(this._headlines) ? "h2" : "h1"}`}
              styles=${"margin-left: 10px"}
              href="#${headline.anchor}"
              >${headline.element.textContent}</a
            >`;
          } else {
            return html`<a
              class=${`link ${this._doesH1Exist(this._headlines) ? "h3" : "h2"}`}
              styles=${"margin-left: 20px"}
              href="#${headline.anchor}"
              >${headline.element.textContent}</a
            >`;
          }
        })}
      </div>
      <div class="separator"></div>
      ${this._headlines[0] &&
      html`<div class="link-container">
        <a class="link" href="#${this._headlines[0].anchor}">Scroll to top</a
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M11 16h2v-4.2l1.6 1.6L16 12l-4-4l-4 4l1.4 1.4l1.6-1.6zm1 6q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
          />
        </svg>
      </div>`}
    </div>`;
  }
}

// add types
declare global {
  interface HTMLElementTagNameMap {
    "inlang-doc-in-page-navigation": InlangDocInPageNavigation;
  }
}
