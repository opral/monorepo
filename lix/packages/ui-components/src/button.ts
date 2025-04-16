import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

export type ButtonProps = {
  primary?: boolean;
  backgroundColor?: string;
  size?: "small" | "medium" | "large";
  label: string;
  onClick?: (event: MouseEvent) => void;
};

@customElement("storybook-button")
export class StorybookButton extends LitElement implements ButtonProps {
  // Define styles within the component
  static styles = css`
    .storybook-button {
      font-family:
        "Nunito Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-weight: 700;
      border: 0;
      border-radius: 3em;
      cursor: pointer;
      display: inline-block;
      line-height: 1;
    }
    .storybook-button--primary {
      color: white;
      background-color: #1ea7fd;
    }
    .storybook-button--secondary {
      color: #333;
      background-color: transparent;
      box-shadow: rgba(0, 0, 0, 0.15) 0px 0px 0px 1px inset;
    }
    .storybook-button--small {
      font-size: 12px;
      padding: 10px 16px;
    }
    .storybook-button--medium {
      font-size: 14px;
      padding: 11px 20px;
    }
    .storybook-button--large {
      font-size: 16px;
      padding: 12px 24px;
    }
  `;

  // Declare reactive properties using the @property decorator
  @property({ type: Boolean, reflect: true }) // reflect makes it a boolean attribute
  accessor primary = false;

  @property({ type: String, attribute: "background-color" }) // Use attribute for kebab-case
  accessor backgroundColor: string = "";

  @property({ type: String, reflect: true })
  accessor size: "small" | "medium" | "large" = "medium";

  @property({ type: String, reflect: true })
  accessor label = "Button";

  // onClick is handled by the event listener in the template, no need for a property
  // unless you need to pass a specific function from outside.
  // If you need to emit a custom event, you can define a method here.

  // The render function returns the component's template
  render() {
    const mode = this.primary
      ? "storybook-button--primary"
      : "storybook-button--secondary";
    // Use styleMap for dynamic styles
    const styles = this.backgroundColor
      ? { backgroundColor: this.backgroundColor }
      : {};

    return html`
      <button
        type="button"
        class="storybook-button storybook-button--${this.size} ${mode}"
        style=${styleMap(styles)}
        @click=${this._onClick}
      >
        ${this.label}
      </button>
    `;
  }

  // Internal handler to dispatch a custom event if needed, or just handle clicks
  private _onClick(event: MouseEvent) {
    // You can dispatch a custom event if parent components need to react
    this.dispatchEvent(
      new CustomEvent("button-click", {
        detail: { originalEvent: event },
        bubbles: true,
        composed: true,
      }),
    );
    // If an external onClick handler was intended (like in original props),
    // you might need a different approach, perhaps passing it as a property
    // and calling it here, but typical Lit usage favors events.
    console.log("Button clicked");
  }
}

// Declare the custom element type globally for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    "storybook-button": StorybookButton;
  }
}
