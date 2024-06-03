import { css } from "lit"

/*
 * This gets into the published component
 */

export const messageBundleStyling = css`
	div {
		box-sizing: border-box;
		font-size: 13px;
	}
	.header {
		font-weight: 600;
		background-color: var(--sl-color-neutral-300);
		padding: 10px;
		display: flex;
		justify-content: flex-start;
		align-items: baseline;
		gap: 10px;
	}
	.messages-container {
		width: 100%;
		margin-bottom: 16px;
	}
	.message {
		display: flex;
		min-height: 44px;
		width: 100%;
		border: 1px solid var(--sl-color-neutral-300);
		border-top: none;
	}
	.message:first-child {
		border-top: 1px solid var(--sl-color-neutral-300);
	}
	.language-container {
		width: 80px;
		min-height: 44px;
		padding: 12px;
		background-color: var(--sl-color-neutral-100);
		border-right: 1px solid var(--sl-color-neutral-300);
	}
	.message-body {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.selector-container {
		width: 100%;
		min-height: 44px;
		display: flex;
		background-color: var(--sl-color-neutral-100);
		border-bottom: 1px solid var(--sl-color-neutral-300);
	}
	.selector {
		height: 44px;
		width: 80px;
		display: flex;
		align-items: center;
		padding: 12px;
		border-right: 1px solid var(--sl-color-neutral-300);
		font-weight: 600;
	}
	.variants-container {
		width: 100%;
		height: 44px;
		display: flex;
		flex-direction: column;
		height: auto;
	}
	.variant {
		position: relative;
		min-height: 44px;
		width: 100%;
		display: flex;
		align-items: center;
		border-top: 1px solid var(--sl-color-neutral-300);
	}
	.variant:first-child {
		border-top: none;
	}
	.match {
		padding: 12px;
		height: 44px;
		width: 80px;
		background-color: var(--sl-color-neutral-100);
		border-right: 1px solid var(--sl-color-neutral-300);
	}
	.pattern {
		flex: 1;
		background-color: none;
		height: 44px;
	}
	.pattern::part(base) {
		border: none;
		border-radius: 0;
		min-height: 44px;
	}
	.pattern::part(input) {
		min-height: 44px;
	}
	.actions {
		position: absolute;
		top: 0;
		right: 0;
		height: 44px;
		display: flex;
		align-items: center;
		gap: 10px;
		padding-right: 12px;
	}
`
