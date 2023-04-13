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
	style="display: flex; flex-direction: column; margin: 20px; position: relative;"
>
	<p style="font-size: 20px;">Translation status</p>
	${percentages.map(
		(percentage: Percentage) =>
			`<div style="display: flex; flex-direction: column;">
			<div style="display: flex; justify-content: space-between; align-items: center;">
				<p>${percentage.lang}</p>
				<p>${100 - percentage.percentage}%</p>
			</div>
			<div
					style="display: flex;
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
			</div>
		`,
	)}
	<div style="display: flex; gap: 4px; margin-top: 15px;">
		<span>Contribute at</span>
		<span style="text-decoration: underline">inlang.com</span>
	</div>
</div>`
