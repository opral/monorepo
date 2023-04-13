import { html } from "satori-html"
import type { Percentage } from "../types.js"

export interface VNode {
	type: string
	props: {
		style?: Record<string, any>
		children?: string | VNode | VNode[]
		[prop: string]: any
	}
}

/**
 * Create the markup for the badge.
 *
 * @param percentages The percentages to display in the badge.
 * @returns The markup for the badge.
 *
 */
export const markup = (percentages: Percentage[]): VNode => html`<div
	style="display: flex; margin-bottom: 10px;"
>
	${percentages.map(
		(percentage: Percentage) =>
			`<div
					style="display: flex;
					position: absolute;
					top: ${40 * (percentages.indexOf(percentage) + 1)}px;
          background: #333;
          border-radius: 13px;
          height: 20px;
          width: 300px;
          padding: 3px;
          overflow: hidden;"
					id="progress"
				>
					<div
						style="display: flex;
          background: #4c1;
          height: 100%;
          border-radius: 9px;
          width: ${100 - percentage.percentage}%;
          transition: width 0.5s ease-in-out;"
					></div>
				</div>
		`,
	)}
</div>`
