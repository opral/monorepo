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
		color: var(--sl-input-color);
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
		background-color: var(--sl-input-border-color-hover);
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
		color: var(--sl-input-color);
	}
	.inputs {
		display: flex;
		align-items: center;
		min-height: 44px;
		gap: 2px;
	}
	.input-tag::part(base) {
		height: 28px;
		font-weight: 500;
		cursor: pointer;
	}
	.text-button::part(base) {
		background-color: transparent;
		border: 1px solid transparent;
	}
	.text-button::part(base):hover {
		background-color: var(--sl-panel-border-color);
		border: 1px solid transparent;
		color: var(--sl-input-color-hover);
	}
	.alias-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.alias {
		font-weight: 400;
		color: var(--sl-input-placeholder-color);
	}
	.alias-counter {
		height: 20px;
		width: 24px;
		font-weight: 500;
		font-size: 11px;
		color: var(--sl-input-color-hover);
		padding: 4px;
		border-radius: 4px;
		background-color: var(--sl-input-background-color-hover);
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
		border: 1px solid var(--sl-input-border-color);
		border-top: none;
	}
	.message:first-child {
		border-top: 1px solid var(--sl-input-border-color);
	}
	.language-container {
		font-weight: 500;
		width: 80px;
		min-height: 44px;
		padding-top: 12px;
		padding-left: 12px;
		padding-right: 12px;
		background-color: var(--sl-input-background-color-disabled);
		border-right: 1px solid var(--sl-input-border-color);
		color: var(--sl-input-color);
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
		background-color: var(--sl-input-background-color-disabled);
		color: var(--sl-input-color);
		border-bottom: 1px solid var(--sl-input-border-color);
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
		border-right: 1px solid var(--sl-input-border-color);
		font-weight: 500;
		cursor: pointer;
	}
	sl-menu-item::part(label) {
		font-size: 14px;
		padding-left: 12px;
	}
	sl-menu-item::part(base) {
		color: var(--sl-input-color);
	}
	sl-menu-item::part(base):hover {
		background-color: var(--sl-input-background-color-hover);
	}
	sl-menu-item::part(checked-icon) {
		display: none;
	}
	.selector:hover {
		background-color: var(--sl-input-background-color-hover);
	}
	.add-selector-container {
		height: 44px;
		width: 44px;
		display: flex;
		align-items: center;
		padding: 12px;
	}
	.add-selector::part(base) {
		height: 28px;
		width: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
	}
	.message-actions {
		height: 44px;
		display: flex;
		align-items: center;
		padding: 12px;
		gap: 8px;
	}
	sl-button::part(base) {
		background-color: var(--sl-input-background-color);
		color: var(--sl-input-color);
		border: 1px solid var(--sl-input-border-color);
	}
	sl-button::part(base):hover {
		background-color: var(--sl-input-background-color-hover);
		color: var(--sl-input-color-hover);
		border: 1px solid var(--sl-input-border-color-hover);
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
		background-color: var(--sl-input-background-color);
		color: var(--sl-input-placeholder-color);
		border-top: 1px solid var(--sl-input-border-color);
		cursor: pointer;
		transitions: all 0.5s;
	}
	.new-variant:hover {
		background-color: var(--sl-input-background-color-hover);
		color: var(--sl-input-color-hover);
	}
	.ref-tag::part(base) {
		background-color: var(--sl-input-placeholder-color);
		color: var(--sl-input-background-color);
		height: 22px;
		border: none;
	}
`
