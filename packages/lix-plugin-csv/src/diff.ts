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

		.list-container {
			font-family: Arial, sans-serif;
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			flex-direction: column;
			width: auto;
			gap: 1rem;
		}

		.container {
			font-family: Arial, sans-serif;
			display: flex;
			flex-wrap: wrap;
			gap: 0.25rem;
		}

		@media (min-width: 768px) {
			.container {
				flex-wrap: nowrap;
				gap: 0.5rem;
			}
		}

		.group {
			display: flex;
			flex-direction: row;
			align-items: center;
			width: auto;
		}

		@media (min-width: 768px) {
			.group {
				flex-direction: column;
				width: 100%;
			}
		}

		.unique-value {
			display: none;
			color: #6b7280;
			padding-top: 0;
			padding-bottom: 0;
			width: 140px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			font-size: 14px;
		}

		@media (min-width: 768px) {
			.unique-value {
				display: block;
				padding: 0.375rem 0;
			}
		}

		.value {
			padding: 0;
			color: black;
			background: none;
			border: none;
			border-radius: 0;

			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		@media (min-width: 768px) {
			.value {
				padding: 0.375rem 1rem;
				background-color: white;
				border: 1px solid #e5e7eb;
				width: 140px;
				border-radius: 9999px;
				margin: 0rem 1rem 0rem 0rem;
			}
		}

		.label {
			color: #6b7280;
			padding: 0.25rem 0;
			margin: 0;
			font-size: 14px;
			text-transform: uppercase;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			width: 100%;
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
			color: var(--color-icon);
			transform: rotate(-90deg);

			@media (min-width: 768px) {
				transform: rotate(0);
			}
		}
	`;

	@property({ type: Array })
	diffs: UiDiffComponentProps["diffs"] = [];

	override render() {
		// group changes based on rowId
		const groupedChanges = this.diffs.reduce(
			(acc: { [key: string]: UiDiffComponentProps["diffs"] }, change) => {
				const key =
					change.snapshot_content_after?.rowId ||
					change.snapshot_content_before?.rowId;
				if (key) {
					if (!acc[key]) {
						acc[key] = [];
					}
					acc[key].push(change);
				}
				return acc;
			},
			{},
		);

		return html` <div class="list-container">
			${Object.keys(groupedChanges).map((rowId) => {
				const changes = groupedChanges[rowId];
				const relationValue = rowId.split("|")[1];
				return html`
					<div class="container">
						<div class="group">
							<p class="label">UNIQUE VALUE</p>
							<p class="value">${relationValue}</p>
						</div>
						${changes?.map((change) => {
							const column = change.entity_id.split("|")[2];
							const value = change.snapshot_content_after?.text;
							const parentValue = change.snapshot_content_before?.text;

							return html`
								<div class="group">
									<p class="label">${column}</p>
									${value
										? html`<p class="box after">${value}</p>`
										: html`<p class="dotted box before"></p>`}
									<svg
										class="icon"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
									>
										<path
											fill="currentColor"
											d="M11 20h2V8l5.5 5.5l1.42-1.42L12 4.16l-7.92 7.92L5.5 13.5L11 8z"
										></path>
									</svg>
									${parentValue
										? html`<p class="box after">${parentValue}</p>`
										: html`<p class="dotted box before"></p>`}
								</div>
							`;
						})}
					</div>
				`;
			})}
		</div>`;
	}
}