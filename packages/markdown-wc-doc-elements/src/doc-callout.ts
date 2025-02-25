import { LitElement, html } from "lit"
import { unsafeHTML } from "lit/directives/unsafe-html.js"

export default class Element extends LitElement {
	static override properties = {
		type: { type: String },
	}

	type!: "info" | "tip" | "warning" | "danger"

	constructor() {
		super()
		this.type = "info"
	}

	override render() {
		return html`
			<div
				style="display: flex; align-items: center; padding: 0.5rem 1rem; border-radius: 0.5rem; background-color: ${colors[
					this.type
				].background}; border: 1px solid ${colors[this.type].border}; margin: 1rem 0;"
			>
				<div
					style="display: flex; align-items: center; margin-right: 1rem; color: #666; font-size: 1.5rem;"
				>
					${unsafeHTML(icons[this.type])}
				</div>
				<div>
					<slot></slot>
				</div>
			</div>
		`
	}
}

if (typeof customElements !== "undefined" && !customElements.get("doc-callout")) {
	customElements.define("doc-callout", Element)
}

const colors = {
	info: {
		background: "#dff7fc",
		border: "#80eaff",
		icon: "#0891b2",
	},
	tip: {
		background: "#e6f4e6",
		border: "#80e680",
		icon: "#008000",
	},
	warning: {
		background: "#fff7cc",
		border: "#ffe680",
		icon: "#ff9900",
	},
	danger: {
		background: "#f9dada",
		border: "#ff8080",
		icon: "#cc0000",
	},
}

const icons = {
	info: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="${colors.info.icon}" d="M12 17q.425 0 .713-.288T13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17m0-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>`,
	tip: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="${colors.tip.icon}" d="M10 18q-.825 0-1.412-.587T8 16v-1.25q-1.425-.975-2.212-2.5T5 9q0-2.925 2.038-4.962T12 2t4.963 2.038T19 9q0 1.725-.788 3.238T16 14.75V16q0 .825-.587 1.413T14 18zm0-2h4v-1.775q0-.25.113-.475t.312-.35l.425-.3q1.025-.7 1.588-1.787T17 9q0-2.075-1.463-3.537T12 4T8.463 5.463T7 9q0 1.225.563 2.313T9.15 13.1l.425.3q.2.125.313.35t.112.475zm0 6q-.425 0-.712-.288T9 21t.288-.712T10 20h4q.425 0 .713.288T15 21t-.288.713T14 22zm2-13"/></svg>`,
	warning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="${colors.warning.icon}" d="M2.725 21q-.275 0-.5-.137t-.35-.363t-.137-.488t.137-.512l9.25-16q.15-.25.388-.375T12 3t.488.125t.387.375l9.25 16q.15.25.138.513t-.138.487t-.35.363t-.5.137zm1.725-2h15.1L12 6zM12 18q.425 0 .713-.288T13 17t-.288-.712T12 16t-.712.288T11 17t.288.713T12 18m0-3q.425 0 .713-.288T13 14v-3q0-.425-.288-.712T12 10t-.712.288T11 11v3q0 .425.288.713T12 15m0-2.5"/></svg>`,
	danger: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="${colors.danger.icon}" d="M9.075 21q-.4 0-.762-.15t-.638-.425l-4.1-4.1q-.275-.275-.425-.638T3 14.926v-5.85q0-.4.15-.762t.425-.638l4.1-4.1q.275-.275.638-.425T9.075 3h5.85q.4 0 .763.15t.637.425l4.1 4.1q.275.275.425.638t.15.762v5.85q0 .4-.15.763t-.425.637l-4.1 4.1q-.275.275-.638.425t-.762.15zm.025-2h5.8l4.1-4.1V9.1L14.9 5H9.1L5 9.1v5.8zm2.9-5.6l2.15 2.15q.275.275.7.275t.7-.275t.275-.7t-.275-.7L13.4 12l2.15-2.15q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275L12 10.6L9.85 8.45q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7L10.6 12l-2.15 2.15q-.275.275-.275.7t.275.7t.7.275t.7-.275zm0-1.4"/></svg>`,
}
