import { Button } from "#src/pages/index/components/Button.jsx";
import { Match, Switch } from "solid-js";
import { registry } from "@inlang/marketplace-registry";
import Card from "./Card.jsx";

type BannerProps = {
	type: "banner";
	link: string;
	slogan: string;
	title: string;
	description: string;
	image: string;
	color: `#${string}`;
};

type CardProps = {
	type: "card";
	id: string;
	slogan: string;
};

export default function Highlight(props: BannerProps | CardProps) {
	return (
		<Switch>
			<Match when={props.type === "banner"}>
				<div
					style={{
						"background-image": `url(${(props as BannerProps).image})`,
					}}
					class={`h-96 w-full bg-surface-100 bg-cover bg-center rounded-2xl flex items-end justify-start relative`}
				>
					<h3 class="font-semibold absolute top-6 left-6 text-background text-2xl px-2">
						{props.slogan}
					</h3>
					<div
						class="w-full flex justify-between md:items-center md:flex-row flex-col px-8 py-4 rounded-b-2xl backdrop-blur-lg border-t"
						style={{
							background: `${(props as BannerProps).color}25`,
							"border-top-color": `${(props as BannerProps).color}30`,
						}}
					>
						<div class="md:mb-0 mb-6">
							<h2 class="text-lg font-semibold mb-1 text-background">
								{(props as BannerProps).title}
							</h2>
							<p class="text-background">
								{(props as BannerProps).description}
							</p>
						</div>
						<Button
							chevron
							type="secondaryOnGray"
							href={(props as BannerProps).link}
						>
							Learn more
						</Button>
					</div>
				</div>
			</Match>
			<Match when={props.type === "card"}>
				<div class="relative">
					<h3 class="font-semibold absolute z-10 top-6 left-6 text-2xl px-2 bg-background/75 backdrop-blur-lg rounded-md">
						{props.slogan}
					</h3>
					<Card
						item={registry.find(
							(item: { id: string }) => item.id === (props as CardProps).id
						)}
						displayName={
							// @ts-expect-error !TODO fix later
							registry.find((item) => item.id === (props as CardProps).id)!
								.displayName.en
						}
					/>{" "}
				</div>
			</Match>
		</Switch>
	);
}
