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
		display: flex;
		justify-content: space-between;
		background-color: var(--sl-color-neutral-300);
		padding: 0 12px;
		min-height: 44px;
	}
	.header-left {
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 16px;
		min-height: 44px;
	}
	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 44px;
	}
	.separator {
		height: 20px;
		width: 1px;
		background-color: var(--sl-color-neutral-400);
		opacity: 0.7;
		border-radius: 1px;
	}
	.slotted-menu-wrapper {
		display: flex;
		flex-direction: column;
	}
	.inputs-wrapper {
		display: flex;
		align-items: center;
		min-height: 44px;
		gap: 8px;
		color: var(--sl-color-neutral-600);
	}
	.inputs {
		display: flex;
		align-items: center;
		min-height: 44px;
		gap: 2px;
	}
	.input-tag::part(base) {
		height: 28px;
		padding: 8px !important;
		background-color: var(--sl-color-neutral-0);
		color: var(--sl-color-neutral-600);
		border: 1px solid var(--sl-color-neutral-400);
		font-weight: 500;
		cursor: pointer;
	}
	.input-tag::part(base):hover {
		background-color: var(--sl-color-neutral-200);
		color: var(--sl-color-neutral-950);
	}
	.add-input::part(base) {
		color: var(--sl-color-neutral-600);
		border: 1px solid var(--sl-color-neutral-400);
		background-color: var(--sl-color-neutral-0);
	}
	.add-input::part(base):hover {
		color: var(--sl-color-neutral-950);
		background-color: var(--sl-color-neutral-200);
	}
	.add-input-tag::part(base) {
		color: var(--sl-color-neutral-600);
		border: none;
		background-color: transparent;
		cursor: pointer;
		height: 28px;
	}
	.add-input-tag::part(base):hover {
		color: var(--sl-color-neutral-950);
		background-color: var(--sl-color-neutral-200);
	}
	.header-button::part(base) {
		color: var(--sl-color-neutral-600);
		border: none;
		background-color: transparent;
		cursor: pointer;
		height: 28px;
	}
	.header-button::part(base):hover {
		color: var(--sl-color-neutral-950);
		background-color: var(--sl-color-neutral-200);
	}
	.header-button::part(label) {
		paddding-right: 4px;
		padding-top: 1px;
	}
	.alias-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.alias {
		font-weight: 400;
		color: var(--sl-color-neutral-600);
	}
	.alias-counter {
		height: 20px;
		width: 24px;
		font-weight: 500;
		font-size: 11px;
		color: var(--sl-color-neutral-600);
		padding: 4px;
		border-radius: 4px;
		background-color: var(--sl-color-neutral-200);
		display: flex;
		align-items: center;
		justify-content: center;
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
		font-weight: 500;
		width: 80px;
		min-height: 44px;
		padding-top: 12px;
		padding-left: 12px;
		padding-right: 12px;
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
	.no-bottom-border {
		border-bottom: none;
	}
	.selector-container {
		min-height: 44px;
		display: flex;
	}
	.selector {
		height: 44px;
		width: 120px;
		display: flex;
		align-items: center;
		padding: 12px;
		border-right: 1px solid var(--sl-color-neutral-300);
		font-weight: 500;
		cursor: pointer;
	}
	sl-menu-item::part(label) {
		font-size: 14px;
		padding-left: 12px;
	}
	sl-menu-item::part(checked-icon) {
		display: none;
	}
	.selector:hover {
		background-color: var(--sl-color-neutral-200);
	}
	.add-selector-container {
		height: 44px;
		width: 44px;
		display: flex;
		align-items: center;
		padding: 12px;
	}
	.add-selector {
		height: 28px;
		width: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--sl-color-neutral-600);
		border-radius: 4px;
		border: 1px solid var(--sl-color-neutral-300);
		background-color: var(--sl-color-neutral-0);
		cursor: pointer;
		font-size: 13px;
	}
	.add-selector:hover {
		color: var(--sl-color-neutral-900);
		background-color: var(--sl-color-neutral-200);
		border: 1px solid var(--sl-color-neutral-400);
	}
	.message-actions {
		height: 44px;
		display: flex;
		align-items: center;
		padding: 12px;
		gap: 8px;
	}
	.message-actions-button::part(base):hover {
		background-color: var(--sl-color-neutral-200);
		color: var(--sl-color-neutral-900);
		border: 1px solid var(--sl-color-neutral-400);
	}
	.variants-container {
		width: 100%;
		height: 44px;
		display: flex;
		flex-direction: column;
		height: auto;
	}
	.new-variant {
		box-sizing: border-box;
		min-height: 44px;
		width: 100%;
		display: flex;
		gap: 4px;
		align-items: center;
		padding-left: 12px;
		margin: 0;
		background-color: var(--sl-color-neutral-0);
		color: var(--sl-color-neutral-400);
		border-top: 1px solid var(--sl-color-neutral-300);
		cursor: pointer;
		transitions: all 0.5s;
	}
	.new-variant:hover {
		background-color: var(--sl-color-neutral-50);
		color: var(--sl-color-neutral-700);
	}
	.ref-tag::part(base) {
		background-color: var(--sl-color-neutral-600);
		color: var(--sl-color-neutral-50);
		border: none;
		height: 22px;
	}
`
