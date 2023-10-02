import { LitElement, css, html } from "lit"
import { customElement, property, query } from "lit/decorators.js"

@customElement("inlang-badge-generator")
export class InlangBadgeGenerator extends LitElement {
	static override styles = css`
		.generator-wrapper {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 100%;
			width: 100%;
			padding: 1rem;
			background: rgba(236, 237, 238, 0.25);
			border-radius: 0.5rem;
			font-weight: 500;
			position: relative;
		}
		.badge-showcase {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			justify-content: center;
			gap: 1rem;
			width: 100%;
			height: 375px;
		}
		.options-wrapper {
			padding: 0.25rem;
			width: calc(100% - 0.5rem);
		}
		.options {
			height: 48px;
			display: flex;
			align-items: center;
			justify-content: flex-end;
			position: relative;
		}
		.options > input {
			position: absolute;
			left: 0;
			top: 0;
			right: 0;
			bottom: 0;
			border: 1px solid #ecedee;
			border-radius: 0.5rem;
			transition: all 0.2s ease-in-out;
			outline-color: rgba(5, 182, 211, 0.1);
			text-indent: 16px;
			font-size: 1rem;
		}
		.options > input:focus {
			outline: 3px solid rgba(5, 182, 211, 0.1);
			border: 1px solid #05b6d3;
		}
		.options > sl-button {
			margin-right: 0.5rem;
		}
		.loading {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1;
			background: rgba(255, 255, 255, 0.8);
			border-radius: 0.5rem;
		}
		.empty-card {
			width: 340px;
			height: 180px;
			border-radius: 0.5rem;
			background: #fff;
			border: 1px solid #dce1e6;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.empty-card > img {
			opacity: 0.5;
		}
		.copy-badge {
			position: absolute;
			right: 32px;
			top: 24px;
			text-align: right;
			cursor: pointer;
			transition: all 0.2s ease-in-out;
		}
		.copy-badge:hover {
			color: #7689a6;
		}
		.error-message {
			position: absolute;
			right: 1.5rem;
			bottom: 5rem;
			font-size: 0.75rem;
			color: #ff4d4f;
			margin-top: 0.5rem;
			font-weight: 400;
		}
	`

	@property() badgeURL: string = ""
	@property() loading: boolean = false
	@property() error: boolean = false

	@query("input", true) _input!: HTMLInputElement

	private _generateBadge() {
		const value = this._input.value

		if (!value.includes("github")) return

		this.loading = true

		const url = new URL(value)
		const path = url.pathname.split("/")
		const { owner, repo } = { owner: path[1], repo: path[2] }

		this.badgeURL = `https://inlang.com/badge?url=github.com/${owner}/${repo}`

		const img = new Image()
		img.src = this.badgeURL

		img.onload = () => {
			this.loading = false
		}
	}

	private checkForError() {
		const value = this._input.value

		if (!value.includes("github") && value !== "") {
			this.error = true
			return
		} else if (this.error) {
			this.error = false
		}
	}

	private copied = false
	@property()
	text: string = "Copy as Markdown"

	private handleCopy() {
		if (!this.copied) {
			this.text = "Successfully copied!"
			this.copied = true
			navigator.clipboard.writeText(
				`[![inlang status badge](${
					this.badgeURL
				})](https://inlang.com/editor/${this.badgeURL.replace(
					"https://inlang.com/badge?url=",
					""
				)}?ref=badge)`
			)

			setTimeout(() => {
				this.text = "Copy as Markdown"
				this.copied = false
			}, 3000)
		}
	}

	override render() {
		return html`<div class="generator-wrapper">
			${this.loading
				? html`<div class="loading"><sl-spinner style="font-size: 3rem;"></sl-spinner></div>`
				: ""}
			<div class="badge-showcase">
				${this.badgeURL !== "" && this.loading === false
					? html`<span @click=${() => this.handleCopy()} class="copy-badge"> ${this.text} </span>`
					: ""}
				${this.badgeURL === ""
					? html`<div class="empty-card">
							<img width="56px" src="http://localhost:3000/favicon/safari-pinned-tab.svg" />
					  </div>`
					: html`<img src=${this.badgeURL} />`}
			</div>
			<div class="options-wrapper">
				${this.error
					? html`<div class="error-message">Please enter a valid GitHub repository link</div>`
					: ""}
				<div class="options">
					<input
						@change=${() => this.checkForError()}
						@keydown=${(e: KeyboardEvent) => {
							if (e.key === "Enter") {
								this._generateBadge()
							}
						}}
						type="text"
						placeholder="Link to your repository"
						style=${this.error
							? "border: 1px solid #ff4d4f; color: #ff4d4f; outline-color: rgba(255, 77, 79, 0.1);"
							: ""}
					/>
					<sl-button @click=${this._generateBadge} variant="primary" size="small"
						>Generate</sl-button
					>
				</div>
			</div>
		</div>`
	}
}
