import { adoptStyles, LitElement, unsafeCSS } from "lit"

// @ts-ignore this did fail on tsc - if we decide to further include tailwind this might get some more investigation
import style from "../styles/tailwind.global.css"

declare global {
	/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
	export type LitMixin<T = unknown> = new (...args: any[]) => T & LitElement
}

const stylesheet = unsafeCSS(style)

export const TW = <T extends LitMixin>(superClass: T): T =>
	class extends superClass {
		override connectedCallback() {
			super.connectedCallback()
			// @ts-ignore this did fail on tsc - if we decide to further include tailwind this might get some more investigation
			adoptStyles(this.shadowRoot, [stylesheet])
		}
	}
