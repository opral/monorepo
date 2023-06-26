import { assertUsage } from "@src/services/assert-usage/index.js"

export function Video(props: { src: string }) {
	assertUsage(
		// eslint-disable-next-line solid/reactivity
		props.src.includes("youtu.be") || props.src.includes("youtube"),
		"Video tag only supports youtube videos",
	)
	/**
	 * The youtube link with a prefixed embed
	 */
	const embedSrc = () => {
		if (props.src.includes("/embed/")) {
			return props.src
		}
		return "https://www.youtube.com/embed" + new URL(props.src).pathname
	}

	return (
		<div class="aspect-w-16 aspect-h-9 rounded">
			<iframe
				src={embedSrc()}
				class="rounded"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
				allowfullscreen
			/>
		</div>
	)
}
