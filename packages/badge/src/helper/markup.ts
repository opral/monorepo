import { html } from "satori-html"
import type { LintReport } from "@inlang/core/lint"

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
 * @param preferredLanguage The preferred language to display in the badge.
 * @returns The markup for the badge.
 *
 */
export const markup = (
	percentage: number,
	numberOfMissingMessages: number,
	lints: LintReport[],
): VNode => {
	// Get language names

	return html`<div
		style="display: flex; padding: 5px 20px; flex-direction: column; position: relative; background-color: white;"
	>
		<p style="font-size: 18px; font-family: "Inter Bold"; font-weight: 700; margin-bottom: 0x; color: #000">
			${headerText({ numberOfMissingMessages, lints })}
		</p>
		<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
			<div style="display: flex; flex-direction: column; align-items: flex-start;">
				<p style="font-size: 20px; font-family: "Inter Bold"; font-weight: 700; margin-bottom: -12px; color: #62c401">
					${percentage}%
				</p>
				<p style="font-size: 14px; font-weight: 700; margin-bottom: 0px;">
					translated
				</p>
			</div>
			<div style="display: flex; flex-direction: column; align-items: flex-start;">
				<p style="font-size: 20px; font-family: "Inter Bold"; font-weight: 700; margin-bottom: -12px; color: ${
					lints.some((lint: LintReport) => lint.level === "error") ? "#c40101" : "#000"
				}">
					${lints.filter((lint: LintReport) => lint.level === "error").length}
				</p>
				<p style="font-size: 14px; font-weight: 700; margin-bottom: 0px;">
					errors
				</p>
			</div>
			<div style="display: flex; flex-direction: column; align-items: flex-start;">
				<p style="font-size: 20px; font-family: "Inter Bold"; font-weight: 700; margin-bottom: -12px; color: ${
					lints.some((lint: LintReport) => lint.level === "warn") ? "#ffa500" : "#000"
				}">
				${lints.filter((lint: LintReport) => lint.level === "warn").length}
				</p>
				<p style="font-size: 14px; font-weight: 700; margin-bottom: 0px;">
					warnings
				</p>
			</div>
		</div>

			<div
				style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 10px; width: 100%; text-align: center; background-color: #000; color: white; border-radius: 4px; padding: 4px 8px;"
			>
				<div style="display: flex; margin-right: 4px;">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect width="24" height="24" rx="1.14783" fill="black" />
						<path
							d="M4.39578 18V9.9064H6.64048V18H4.39578ZM5.5234 8.86309C5.18968 8.86309 4.90338 8.75243 4.66451 8.53112C4.42915 8.3063 4.31147 8.03757 4.31147 7.72493C4.31147 7.4158 4.42915 7.15058 4.66451 6.92927C4.90338 6.70444 5.18968 6.59203 5.5234 6.59203C5.85712 6.59203 6.14166 6.70444 6.37702 6.92927C6.61589 7.15058 6.73533 7.4158 6.73533 7.72493C6.73533 8.03757 6.61589 8.3063 6.37702 8.53112C6.14166 8.75243 5.85712 8.86309 5.5234 8.86309ZM10.5349 13.3209V18H8.29024V9.9064H10.4296V11.3344H10.5244C10.7036 10.8637 11.0039 10.4913 11.4255 10.2173C11.847 9.93978 12.3581 9.80102 12.9588 9.80102C13.5209 9.80102 14.0109 9.92397 14.4289 10.1699C14.847 10.4158 15.1719 10.7671 15.4038 11.2237C15.6356 11.6769 15.7515 12.2179 15.7515 12.8467V18H13.5068V13.2471C13.5103 12.7518 13.3839 12.3654 13.1274 12.0879C12.871 11.8069 12.5179 11.6663 12.0683 11.6663C11.7662 11.6663 11.4992 11.7313 11.2674 11.8613C11.039 11.9913 10.8599 12.181 10.7299 12.4304C10.6034 12.6763 10.5385 12.9731 10.5349 13.3209ZM19.617 7.20854V18H17.3723V7.20854H19.617Z"
							fill="white"
						/>
					</svg>
				</div>
				<span style="font-size: 15px;">Contribute now</span>
			</div>
			<div style="display: flex; height: 200px; width: 100%; background-color: white;"></div>
		</div>
	</div>`
}

function headerText(args: { numberOfMissingMessages: number; lints: LintReport[] }): string {
	if (args.numberOfMissingMessages > 0) {
		return `${args.numberOfMissingMessages} messages missing`
	} else if (args.lints.some((lint: LintReport) => lint.level === "error")) {
		return "The project contains errors"
	} else {
		return "All messages translated"
	}
}
