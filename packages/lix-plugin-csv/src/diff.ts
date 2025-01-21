import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import type { UiDiffComponentProps } from "@lix-js/sdk";

export class DiffComponent extends LitElement {
	static override styles = css`
		:host {
			/* Ensure the component respects app-wide theming */
			--color-border: #e2e8f0;
			--color-background: #ffffff;
			--color-icon: #9ca3af; /* Default gray */
			--color-text: #000000; /* Default text color */
		}

		.container {
			font-family: Arial, sans-serif;
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			flex-direction: column;
			width: auto;
			gap: 0.5rem;
		}

		.box {
			overflow: hidden;
			padding: 0.375rem 0.75rem;
			margin: 0;
			flex: 1 1 0%;
			border: 1px solid var(--color-border);
			text-overflow: ellipsis;
			white-space: nowrap;
			background-color: var(--color-background);
			color: var(--color-text);
			min-height: 1.5rem;
			width: fit-content;
			min-width: 140px;
		}

		.box.dotted {
			border-style: dashed;
			background-color: transparent;
		}

		.icon {
			margin: 0.25rem;
			width: 18px;
			height: 18px;
		}
	`;

	@property({ type: Array })
	diffs: UiDiffComponentProps["diffs"] = [];

	override render() {
		return html`
			<div class="container">
				${this.diffs.map(
					(diff) => html`
						<p class="box after">${diff.snapshot_content_after?.text || ""}</p>
						<svg
							class="icon"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
						>
							<path
								fill="var(--color-icon)"
								d="M11 20h2V8l5.5 5.5l1.42-1.42L12 4.16l-7.92 7.92L5.5 13.5L11 8z"
							></path>
						</svg>
						${diff.snapshot_content_before?.text
							? html`<p class="box before">
									${diff.snapshot_content_before?.text || ""}
								</p>`
							: html`<p class="dotted box before"></p>`}
					`,
				)}
			</div>
		`;
	}
}
