import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("doc-slider")
export class DocSlider extends LitElement {
	private _firstIndex: number
	private _offset: number

	@property()
	looping: boolean

	@property()
	items: string[]
	constructor() {
		super()

		this.items = []
		this.looping = false
		this._firstIndex = 0
		this._offset = 0
	}

	override connectedCallback() {
		super.connectedCallback()

		window.addEventListener("resize", this._initiateContainers)
	}

	override disconnectedCallback() {
		super.disconnectedCallback()

		window.removeEventListener("resize", this._initiateContainers)
	}

	static override get styles() {
		return css`
			:host {
				--item-margin: 8px;
				--item-offset: 7px;
				--item-width: 348px;
				display: flex;
				flex-direction: row;
			}

			.btn-next,
			.btn-prev {
				background: none;
				border: 0;
				color: #1e313b;
				cursor: pointer;
				font-size: 36px;
				outline: none;
				background-color: #e2e8f0;
				width: 40px;
				height: 40px;
				aspect-ratio: 1;
				max-width: 40px;
				max-height: 40px;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.2s ease-in-out;
				position: absolute;
				top: 50%;
				transform: translateY(-50%);
				z-index: 1;
			}

			.btn-next {
				right: -20px;
			}

			.btn-prev {
				left: -20px;
			}

			.btn-next:hover,
			.btn-prev:hover {
				color: #10172a;
				background-color: #cbd5e1;
			}

			.hidden {
				visibility: hidden;
			}

			#contents {
				display: flex;
				flex: 1;
				overflow: hidden;
				position: relative;
			}

			.wrapper {
				position: relative;
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
				width: calc(100% - 40px);
				margin: 0 auto;
			}

			article {
				box-shadow: 0 0 0 1px rgba(63, 63, 68, 0.05), 0 1px 3px 0 rgba(63, 63, 68, 0.15);
				box-sizing: border-box;
				flex-shrink: 0;
				margin: var(--item-margin);
				/* width + left and right margins */
				transform: translateX(calc(-1 * var(--item-offset)));
				transition: transform 300ms;
				width: var(--item-width);
				border-radius: 0.5rem;
			}

			article img {
				object-fit: cover;
				width: 100%;
				height: 100%;
				border-radius: 0.5rem;
			}

			:host([looping]) article {
				transition: none;
			}
		`
	}

	override render() {
		return html`
			<div class="wrapper">
				<button class="btn-prev" @click=${() => this._move("left")}>
					<doc-icon height="40" icon="mdi:chevron-left"></doc-icon>
				</button>
				<div id="contents">
					${this.items.map(
						(item) => html`
							<article>
								<img src="${item}" />
							</article>
						`
					)}
				</div>
				<button class="btn-next" @click=${() => this._move("right")}>
					<doc-icon height="40" icon="mdi:chevron-right"></doc-icon>
				</button>
			</div>
		`
	}

	_initiateContainers() {}

	/**
	 * Moves the items to the specified direction.
	 * @param {string} direction The movement direction.
	 */
	_move(direction: string) {
		const container = this.shadowRoot?.getElementById("contents")
		const styles = getComputedStyle(this)
		const itemMargin = parseFloat(styles.getPropertyValue("--item-margin"))
		const itemWidth = parseFloat(styles.getPropertyValue("--item-width"))
		const itemTotalWidth = itemWidth + 2 * itemMargin

		if (this.looping) {
			const items = container?.querySelectorAll("article")

			if (!items) {
				return
			}

			const lastIndex = items.length - 1

			if (direction === "left") {
				this._firstIndex = this._firstIndex === 0 ? lastIndex : this._firstIndex - 1
			} else {
				this._firstIndex = this._firstIndex === lastIndex ? 0 : this._firstIndex + 1
			}

			// Move items from this._firstIndex to the lastIndex left.
			for (let i = this._firstIndex; i < items.length; i++) {
				items[i]!.style.transform = `translateX(-${itemTotalWidth * this._firstIndex}px)`
			}

			// Move the rest of the items right.
			for (let i = 0; i < this._firstIndex; i++) {
				items[i]!.style.transform = `translateX(${
					itemTotalWidth * (items.length - this._firstIndex)
				}px)`
			}
		} else {
			const itemsTotalWidth = itemTotalWidth * this.items.length
			const buffer = itemsTotalWidth - container!.clientWidth

			if (direction === "left") {
				this._offset = this._offset - itemTotalWidth >= 0 ? this._offset - itemTotalWidth : 0
			} else {
				this._offset =
					this._offset + itemTotalWidth > buffer ? buffer : this._offset + itemTotalWidth
			}
		}

		this.style.setProperty("--item-offset", `${this._offset}px`)
	}
}
