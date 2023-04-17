import { html } from "satori-html"
import type { Percentage } from "../types.js"
import { getTotalTranslatedPercentage } from "./index.js"

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
	percentages: Percentage[],
	preferredLanguage: string | undefined,
	project: string,
): VNode => {
	// Get language names
	const languageNames = new Intl.DisplayNames(["en"], {
		type: "language",
	})

	// If preferred language is not set, set it to english
	if (!preferredLanguage) {
		preferredLanguage = "en"
	}

	// Remove the region from the language
	if (preferredLanguage?.includes("-")) {
		preferredLanguage = preferredLanguage.split("-")[0]
	}

	// check if the preferred language is set but there is no corresponsidng object with a lang attribute in percentages for it
	// this happens when the preferred language is set to a language that is not in the project
	if (
		preferredLanguage &&
		!percentages.map((percentage) => percentage.lang).includes(preferredLanguage) &&
		percentages.map((percentage) => percentage.lang).includes("en")
	) {
		preferredLanguage = "en"
	} else {
		// set to first language in percentages
		preferredLanguage = percentages[0].lang
	}

	// sort percentages by preferred language
	const sortedPercentages = percentages.sort((a, b) => {
		if (a.lang === preferredLanguage) {
			return -1
		}
		if (b.lang === preferredLanguage) {
			return 1
		}
		return 0
	})

	// Get the total translated percentage
	const total = getTotalTranslatedPercentage(sortedPercentages)

	return html`<div
		style="display: flex; padding: 20px; flex-direction: column; position: relative; background-color: white;"
	>
		<p style="font-size: 24px; font-weight: 600; margin-bottom: 0px;">
			${Math.round(100 - total)}% translated.
		</p>
		<p style="font-size: 18px; margin-bottom: 0px;">
			${`Support ${project} by translating it into ${languageNames
				.of(preferredLanguage)
				?.toLocaleLowerCase()}.`}
		</p>
		<p style="font-size: 18px; font-weight: 600; margin-bottom: 25px;">
			${sortedPercentages.find((p) => p.lang === preferredLanguage)?.count.lint
				? `
				${sortedPercentages.find((p) => p.lang === preferredLanguage)?.count.lint}${" "}${languageNames
						.of(preferredLanguage)
						?.toLocaleLowerCase()}${" "}${
						sortedPercentages.find((p) => p.lang === preferredLanguage)?.count.lint === 1
							? "translation is"
							: "translations are"
				  } missing.
			`
				: `All ${languageNames
						.of(preferredLanguage)
						?.toLocaleLowerCase()} translations are complete.`}
		</p>
		${sortedPercentages.map(
			(percentage: Percentage) =>
				`<div style="display: flex;
						margin-bottom: 10px;
						position: relative;
						height: 40px;
						width: 100%;
						width: 100%;">
						<div style="display: flex;
							z-index: 1;
							position: absolute;
							top: 0;
							right: 0;
							bottom: 0;
							left: 0;
							background-color: ${percentage.lang === preferredLanguage ? `#5ded27` : `#cdcdcd`};
							height: 100%;
							border-radius: 4px;
							width: ${100 - percentage.percentage}%;">
						</div>
						<div style="z-index: 2;
						display: flex;
						justify-content: space-between;
						width: 100%;
						padding: 7px 10px;
						position: relative;
						top: -12px;">
							<p>${percentage.lang}</p>
							<p>${100 - percentage.percentage}%</p>
						</div>
					</div>`,
		)}
		<div
			style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 15px; width: 100%; text-align: center;"
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
			<span>Contribute at</span>
			<span style="text-decoration: underline">inlang.com</span>
		</div>
		<div style="display: flex; height: 200px; width: 100%; background-color: white;"></div>
	</div>`
}
