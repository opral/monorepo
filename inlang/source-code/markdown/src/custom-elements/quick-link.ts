import { LitElement, css, html } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("quick-link")
export class QuickLink extends LitElement {
	static override styles = css`
		a {
			text-decoration: none;
			color: inherit;
			display: inner-block;
			margin: 0;
		}
		.quick-link {
			padding: 1rem;
			border-radius: 0.5rem;
			background-color: #f1f5f9;
			transition: background-color 0.2s ease-in-out;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
		.quick-link:hover {
			background-color: #e1e7f0;
		}
		.quick-link > * {
			margin: 0;
		}
		.quick-link > h4 {
			font-weight: 600;
		}
		.icons {
			display: flex;
			justify-content: flex-start;
			gap: 8px;
			margin-bottom: 16px;
		}
		.icon {
			display: flex;
			width: 40px;
			height: 40px;
			justify-content: center;
			align-items: center;
			border-radius: 8px;
			background-color: #e3e8ee;
			color: #475569;
		}
	`
	@property()
	override title: string = ""
	@property()
	icon: "fast" | "add-plugin" | "" = ""
	@property()
	href: string = ""
	@property()
	description: string = ""

	override render() {
		return html`<a href="${this.href}">
			<div class="quick-link">
				<div class="icons">
					<div class="icon">
						${this.icon === "fast"
							? html`<svg
									viewBox="0 0 24 24"
									width="1.4em"
									height="1.4em"
									name="fast"
									class="h-6 w-6 text-info"
							  >
									<path
										fill="currentColor"
										d="M4.05 16.975q-.5.35-1.025.05t-.525-.9v-8.25q0-.6.525-.9t1.025.05l6.2 4.15q.45.3.45.825t-.45.825l-6.2 4.15Zm10 0q-.5.35-1.025.05t-.525-.9v-8.25q0-.6.525-.9t1.025.05l6.2 4.15q.45.3.45.825t-.45.825l-6.2 4.15ZM4.5 12Zm10 0Zm-10 2.25L7.9 12L4.5 9.75v4.5Zm10 0L17.9 12l-3.4-2.25v4.5Z"
									></path>
							  </svg>`
							: this.icon === "add-plugin"
							? html`<svg
									viewBox="0 0 24 24"
									width="1.4em"
									height="1.4em"
									name="add-plugin"
									class="h-6 w-6 text-info"
							  >
									<path
										fill="currentColor"
										d="M8.8 21H5q-.825 0-1.413-.588T3 19v-3.8q1.2 0 2.1-.762T6 12.5q0-1.175-.9-1.937T3 9.8V6q0-.825.588-1.413T5 4h4q0-1.05.725-1.775T11.5 1.5q1.05 0 1.775.725T14 4h4q.825 0 1.413.588T20 6v4q1.05 0 1.775.725T22.5 12.5q0 1.05-.725 1.775T20 15v4q0 .825-.588 1.413T18 21h-3.8q0-1.25-.787-2.125T11.5 18q-1.125 0-1.913.875T8.8 21ZM5 19h2.125q.6-1.65 1.925-2.325T11.5 16q1.125 0 2.45.675T15.875 19H18v-6h2q.2 0 .35-.15t.15-.35q0-.2-.15-.35T20 12h-2V6h-6V4q0-.2-.15-.35t-.35-.15q-.2 0-.35.15T11 4v2H5v2.2q1.35.5 2.175 1.675T8 12.5q0 1.425-.825 2.6T5 16.8V19Zm7.75-7.75Z"
									></path>
							  </svg>`
							: ""}
					</div>
				</div>
				<h4>${this.title}</h4>
				<p>${this.description}</p>
			</div>
		</a>`
	}
}

// takes the inner elements and just renders them with custom styles around them
@customElement("quick-links")
export class QuickLinks extends LitElement {
	static override styles = css`
		.quick-link-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			grid-gap: 1rem;
		}
	`

	override render() {
		return html`<div class="quick-link-grid">
			<slot></slot>
		</div>`
	}
}
