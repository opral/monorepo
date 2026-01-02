import { For } from "solid-js";
import Link from "#src/renderer/Link.jsx";
import {
	IconAstro,
	IconJavascript,
	IconNextjs,
	IconReact,
	IconRemix,
	IconSolid,
	IconSvelte,
	IconVue,
} from "#src/interface/custom-icons/subcategoryIcon.jsx";
import * as m from "#src/paraglide/messages.js";

const logoStyling = "w-8 h-8 opacity-80 group-hover:opacity-100 transition-all";

const stacks = [
	{
		name: "Svelte",
		param: "svelte",
		icon: <IconSvelte class={logoStyling} />,
		link: "/m/gerre34r/library-inlang-paraglideJs/sveltekit",
	},
	{
		name: "Next.js",
		param: "nextjs",
		icon: <IconNextjs class={"w-[28px] h-[28px] " + logoStyling} />,
		link: "/m/gerre34r/library-inlang-paraglideJs/nextjs",
	},
	{
		name: "Solid",
		param: "solid",
		icon: <IconSolid class={logoStyling} />,
		link: "/m/gerre34r/library-inlang-paraglideJs/vite",
	},
	{
		name: "Astro",
		param: "astro",
		icon: <IconAstro class={logoStyling} />,
		link: "/m/gerre34r/library-inlang-paraglideJs/astro",
	},
	{
		name: "Remix",
		param: "remix",
		icon: <IconRemix class={"w-[34px] h-[34px] " + logoStyling} />,
		link: "/m/gerre34r/library-inlang-paraglideJs/vite",
	},
	{
		name: "React",
		param: "react",
		icon: <IconReact class={"w-[34px] h-[34px] " + logoStyling} />,
		link: "/m/gerre34r/library-inlang-paraglideJs/vite",
	},
	{
		name: "Vue",
		param: "vue",
		icon: <IconVue class={logoStyling} />,
		link: "/m/gerre34r/library-inlang-paraglideJs/vite",
	},
	{
		name: "Javascript",
		param: "javascript",
		icon: <IconJavascript class={logoStyling} />,
		link: "/m/gerre34r/library-inlang-paraglideJs/vanilla-js-ts",
	},
];

const DeveloperSlide = () => {
	const cards = [
		{
			title: m.home_personas_developer_cards_cli_title(),
			description: m.home_personas_developer_cards_cli_description(),
			href: "/m/2qj2w8pu",
			logo: "/images/cli-logo-landingpage.png",
			cover: "/images/cli-cover-landingpage.png",
		},
		{
			title: m.home_personas_developer_cards_ide_title(),
			description: m.home_personas_developer_cards_ide_description(),
			href: "/m/r7kp499g",
			logo: "https://cdn.jsdelivr.net/gh/opral/inlang@main/packages/ide-extension/assets/sherlock-logo.png",
			cover: "/images/ide-extension-cover-landingpage.png",
		},
	];

	return (
		<div class="flex flex-col gap-6 md:gap-4 py-6 h-full">
			<div class="px-6 md:px-8">
				<div class="flex items-center justify-between">
					<h3 class="font-medium text-surface-600">
						{m.home_personas_developer_apps_title()}
					</h3>
					<Link
						class="flex items-center gap-2 text-surface-500 group"
						href="/c/apps"
					>
						<p class="group-hover:text-surface-600">
							{m.home_personas_developer_more_apps()}
						</p>
						<div class="w-8 h-8 border border-surface-300 rounded-full flex justify-center items-center group-hover:bg-surface-100 transition-all text-surface-500 group-hover:text-surface-900">
							<Arrow />
						</div>
					</Link>
				</div>
				<div class="grid md:grid-cols-2 h-[430px] sm:h-[530px] md:h-[244px] gap-4 mt-4">
					<For each={cards}>
						{(card) => (
							<Link
								class="relative bg-gradient-to-b from-surface-200 rounded-xl p-[1px] hover:from-surface-300 transition-all"
								href={card.href}
							>
								<div class="absolute w-full top-0 left-0 pointer-events-none">
									<img
										class="sm:w-3/4 md:w-full xl:w-3/4 mx-auto"
										src={card.cover}
										alt="cover"
									/>
								</div>
								<div class="flex flex-col justify-end col-span-1 h-full rounded-[11px] bg-gradient-to-b from-surface-50 hover:from-surface-100 to-background hover:to-background p-6">
									<div class="flex items-center gap-4">
										<div class="w-10 h-10 rounded overflow-hidden">
											<img src={card.logo} alt="logo" />
										</div>
										<div>
											<h4 class="font-bold text-surface-600">{card.title}</h4>
											<p class="text-surface-500 text-sm">{card.description}</p>
										</div>
									</div>
								</div>
							</Link>
						)}
					</For>
				</div>
			</div>
			<div class="pl-6 md:pl-8 md:pr-8">
				<h3 class="font-medium text-surface-600">
					{m.home_personas_developer_stack_title()}
				</h3>
				<StackList />
			</div>
		</div>
	);
};

export default DeveloperSlide;

export function StackList() {
	return (
		<div class="flex gap-[10px] md:gap-4 mt-4 overflow-x-scroll hide-scrollbar">
			<For each={stacks}>
				{(stack) => (
					<Link href={stack.link} class="flex-1 min-w-[64px]">
						<div class="group w-full flex flex-col items-center gap-2">
							<div class="flex w-full justify-center items-center border border-surface-200 hover:border-surface-300 bg-gradient-to-b from-surface-50 hover:from-surface-100 rounded-lg h-[60px] overflow-hidden">
								{stack.icon}
							</div>
							<p class="text-center text-sm text-surface-500 font-medium">
								{stack.name}
							</p>
						</div>
					</Link>
				)}
			</For>
		</div>
	);
}

export function Arrow() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			fill="none"
			viewBox="0 0 28 28"
		>
			<path
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2.75"
				d="M3 14h22m0 0l-8.25 8.25M25 14l-8.25-8.25"
			/>
		</svg>
	);
}
