import * as m from "#src/paraglide/messages.js"

const CredibilityTag = (props: { projectCount: string }) => {
	return (
		<div class="flex items-center gap-3 mt-8 bg-background pr-4 pl-1.5 py-1 rounded-full text-sm font-medium w-fit border shadow border-surface-300 text-surface-600">
			<div class="flex justify-center items-center w-8 h-8 bg-surface-100 rounded-full">
				<TrophyIcon />
			</div>
			<p
				// eslint-disable-next-line solid/no-innerhtml
				innerHTML={markNumberAsBold(
					m.home_credibility_tag_text({ count: props.projectCount }),
					props.projectCount
				)}
			/>
		</div>
	)
}

export default CredibilityTag

function TrophyIcon() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 16 16">
			<path
				fill="#475569"
				d="M15.2 1.6h-2.4V.8A.8.8 0 0012 0H4a.8.8 0 00-.8.8v.8H.8a.8.8 0 00-.8.8v2.4A3.2 3.2 0 003.2 8h1.232A4.8 4.8 0 007.2 9.528V11.2h-.8A2.4 2.4 0 004 13.6v1.6a.8.8 0 00.8.8h6.4a.8.8 0 00.8-.8v-1.6a2.4 2.4 0 00-2.4-2.4h-.8V9.528A4.8 4.8 0 0011.568 8H12.8A3.2 3.2 0 0016 4.8V2.4a.8.8 0 00-.8-.8zm-12 4.8a1.6 1.6 0 01-1.6-1.6V3.2h1.6v1.6a4.8 4.8 0 00.28 1.6H3.2zm6.4 6.4a.8.8 0 01.8.8v.8H5.6v-.8a.8.8 0 01.8-.8h3.2zm1.6-8a3.2 3.2 0 11-6.4 0V1.6h6.4v3.2zm3.2 0a1.6 1.6 0 01-1.6 1.6h-.28a4.8 4.8 0 00.28-1.6V3.2h1.6v1.6z"
			/>
		</svg>
	)
}

function markNumberAsBold(completeString: string, number: string) {
	if (number && typeof number === "number") {
		return completeString.replace(
			number,
			`<span class="font-bold text-surface-900">${number}</span>`
		)
	} else {
		return completeString
	}
}
