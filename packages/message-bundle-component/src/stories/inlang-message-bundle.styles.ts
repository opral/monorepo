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
		position: relative;
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
	.message-header {
		width: 100%;
		min-height: 44px;
		display: flex;
		justify-content: space-between;
		background-color: var(--sl-color-neutral-100);
		border-bottom: 1px solid var(--sl-color-neutral-300);
	}
	.selector-container {
		min-height: 44px;
		display: flex;
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
	.message-actions {
		height: 44px;
		display: flex;
		align-items: center;
		padding: 12px;
	}
	.variants-container {
		width: 100%;
		height: 44px;
		display: flex;
		flex-direction: column;
		height: auto;
	}
`
