import { For } from "solid-js"
import { Arrow } from "./Developer.jsx"
import Link from "#src/renderer/Link.jsx"
import { Button } from "../../components/Button.jsx"

const cards = [
	{
		title: "Fink - Translation Editor",
		description: "Translation right from the browser.",
		href: "/m/tdozzpar",
		logo: "https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/source-code/editor/assets/christmasFink.png",
		cover: "/images/fink-cover-landingpage.png",
	},
	{
		title: "Translation status badge",
		description: "Show missing messages in a markdown file.",
		href: "/m/zu942ln6",
		logo: "https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/source-code/badge/assets/images/badge-icon.jpg",
		cover: "/images/badge-cover-landingpage.png",
	},
]

const TranslatorSlide = () => {
	return (
		<div class="flex flex-col gap-4 px-8 py-6 h-full">
			<div>
				<div class="flex items-center justify-between">
					<h3 class="font-medium text-surface-600">Apps for Translators</h3>
					<Link class="flex items-center gap-2 text-surface-500 group" href="/c/apps">
						<p class="group-hover:text-surface-600">More Apps</p>
						<div class="w-8 h-8 border border-surface-300 rounded-full flex justify-center items-center group-hover:bg-surface-100 transition-all text-surface-500 group-hover:text-surface-900">
							<Arrow />
						</div>
					</Link>
				</div>
				<div class="grid grid-cols-2 h-[254px] gap-4 mt-4">
					<For each={cards}>
						{(card) => (
							<Link
								class="relative bg-gradient-to-b from-surface-200 rounded-xl p-[1px] hover:from-surface-300 transition-all"
								href={card.href}
							>
								<div class="absolute w-full top-0 left-0 pointer-events-none">
									<img src={card.cover} alt="cover" />
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
			<div>
				<h3 class="font-medium text-surface-600">Guide for Translators</h3>
				<div class="flex justify-between items-center p-4 border border-surface-200 mt-4 rounded-xl bg-gradient-to-b from-surface-50">
					<div class="flex items-center gap-4">
						<p class="font-semibold text-primary bg-primary/20 px-4 py-1.5 rounded-lg">Guide</p>
						<h3 class="text-surface-900 font-semibold">How to contribute Translations</h3>
						<p class="text-surface-500">A Beginner guide that helps translators.</p>
					</div>
					<Button
						chevron
						type="secondary"
						href="/g/6ddyhpoi/guide-nilsjacobsen-contributeTranslationsWithFink"
					>
						Read Guide
					</Button>
				</div>
			</div>
		</div>
	)
}

export default TranslatorSlide
