import { JSX } from "solid-js/jsx-runtime"
import { Button } from "#src/pages/index/components/Button.jsx"
import { Match, Switch } from "solid-js"
import { registry } from "@inlang/marketplace-registry"
import Card from "./Card.jsx"

type BannerProps = {
	type: "banner"
	link: string
	slogan: string
	title: string
	description: string
	image: string
	color: `#${string}`
}

type CardProps = {
	type: "card"
	id: string
}

export default function Highlight(props: BannerProps | CardProps) {
	console.log(props)
	return (
		<Switch>
			<Match when={props.type === "banner"}>
				<div
					style={{
						"background-image": `url(${props.image})`,
					}}
					class={`h-96 w-full bg-surface-100 bg-cover bg-center rounded-2xl flex items-end justify-start relative`}
				>
					<h3 class="font-semibold absolute top-6 left-8 text-background text-2xl">
						{props.slogan}
					</h3>
					<div
						class="w-full flex justify-between md:items-center md:flex-row flex-col px-8 py-4 rounded-b-2xl backdrop-blur-lg border-t"
						style={{
							background: `${props.color}25`,
							"border-top-color": `${props.color}30`,
						}}
					>
						<div class="md:mb-0 mb-6">
							<h2 class="text-lg font-semibold mb-1 text-background">{props.title}</h2>
							<p class="text-background">{props.description}</p>
						</div>
						<Button chevron type="secondaryOnGray" href={props.link}>
							Learn more
						</Button>
					</div>
				</div>
			</Match>
			<Match when={props.type === "card"}>
				<Card
					item={registry.find((item) => item.id === props.id)}
					displayName={registry.find((item) => item.id === props.id).displayName.en}
				/>
			</Match>
		</Switch>
	)
}
