import { LitElement, css, html, type TemplateResult } from "lit"
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
			border-radius: 0.5rem;
			font-weight: 500;
			position: relative;
		}
		.mockup-stroke-wrapper {
			position: absolute;
			background: rgba(236, 237, 238, 0.25);
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			display: flex;
			flex-direction: column;
			align-items: start;
			justify-content: start;
			padding: 1rem;
			border-radius: 0.5rem;
			z-index: 0;
		}
		.mockup-stroke {
			height: 1rem;
			background: #ebeff2;
			border-radius: 0.5rem;
			margin-bottom: 1.5rem;
		}
		.mockup-stroke:nth-child(1) {
			width: 65%;
		}
		.mockup-stroke:nth-child(2) {
			width: 75%;
		}
		.mockup-stroke:nth-child(3) {
			width: 20%;
		}
		.mockup-stroke:nth-child(4) {
			width: 25%;
		}
		.mockup-stroke:nth-child(5) {
			width: 22%;
		}
		.mockup-stroke:nth-child(6) {
			width: 10%;
		}
		.mockup-stroke:nth-child(7) {
			width: 12%;
		}
		.mockup-stroke:nth-child(8) {
			width: 25%;
		}
		.mockup-stroke:nth-child(9) {
			width: 80%;
		}
		.mockup-stroke:nth-child(10) {
			width: 55%;
		}

		.badge-showcase {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			justify-content: center;
			gap: 1rem;
			width: 100%;
			height: 400px;
			z-index: 1;
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
			display: flex;
			align-items: center;
			gap: 0.5rem;
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
		.image {
			right: 32px;
			top: 60px;
		}
	`

	@property() badgeURL: string = ""
	@property() loading: boolean = false
	@property() error: boolean = false

	@query("input", true) _input!: HTMLInputElement

	private _generateBadge() {
		const value = this._input.value

		if (!value.includes("github") || value.length < 20) return

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

		if ((!value.includes("github") && value !== "") || (value.length < 20 && value !== "")) {
			this.error = true
			return
		} else if (this.error) {
			this.error = false
		}
	}

	private markdownCopied = false
	@property()
	copyMarkdownText: TemplateResult = html`<doc-icon size="1.6em" icon="mdi:markdown"></doc-icon>
		Copy as Markdown`

	private handleCopyMarkdown() {
		if (!this.markdownCopied) {
			this.copyMarkdownText = html`<doc-icon size="1.6em" icon="mdi:markdown"></doc-icon>
				Successfully copied!`
			this.markdownCopied = true
			navigator.clipboard.writeText(
				`[![inlang status badge](${
					this.badgeURL
				})](https://inlang.com/editor/${this.badgeURL.replace(
					"https://inlang.com/badge?url=",
					""
				)}?ref=badge)`
			)

			setTimeout(() => {
				this.copyMarkdownText = html`<doc-icon size="1.6em" icon="mdi:markdown"></doc-icon> Copy as
					Markdown`
				this.markdownCopied = false
			}, 3000)
		}
	}

	private imageCopied = false
	@property()
	copyImageText: TemplateResult = html`<doc-icon size="1.4em" icon="mdi:image"></doc-icon> Copy
		image source`

	private handleCopyImage() {
		if (!this.imageCopied) {
			this.copyImageText = html`<doc-icon size="1.4em" icon="mdi:image"></doc-icon> Successfully
				copied!`
			this.imageCopied = true
			navigator.clipboard.writeText(this.badgeURL)

			setTimeout(() => {
				this.copyImageText = html`<doc-icon size="1.4em" icon="mdi:image"></doc-icon> Copy image
					source`
				this.imageCopied = false
			}, 3000)
		}
	}

	override render() {
		return html`<div class="generator-wrapper">
			<div class="mockup-stroke-wrapper">
				<div class="mockup-stroke"></div>
				<div class="mockup-stroke"></div>
				<div class="mockup-stroke"></div>
				<div class="mockup-stroke"></div>
				<div class="mockup-stroke"></div>
				<div class="mockup-stroke"></div>
				<div class="mockup-stroke"></div>
				<div class="mockup-stroke"></div>
				<div class="mockup-stroke"></div>
				<div class="mockup-stroke"></div>
			</div>
			${this.loading
				? html`<div class="loading"><sl-spinner style="font-size: 3rem;"></sl-spinner></div>`
				: ""}
			<div class="badge-showcase">
				${this.badgeURL !== "" && this.loading === false
					? html`<span @click=${() => this.handleCopyMarkdown()} class="copy-badge">
							${this.copyMarkdownText}
					  </span>`
					: ""}
				${this.badgeURL !== "" && this.loading === false
					? html`<div @click=${() => this.handleCopyImage()} class="copy-badge image">
							${this.copyImageText}
					  </div>`
					: ""}
				${this.badgeURL === ""
					? html`<div class="empty-card">
							<img width="56px" src="http://inlang.com/favicon/safari-pinned-tab.svg" />
					  </div>`
					: html`<img src=${this.badgeURL} />`}
			</div>
			<div class="options-wrapper">
				${this.error
					? html`<div class="error-message">Please enter a valid GitHub repository link</div>`
					: ""}
				<div class="options">
					<input
						${this.loading ? "disabled" : ""}
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
