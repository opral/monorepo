import { Button } from "../../components/Button.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import Flutter from "./assets/flutter.jsx"
import InlangWordIcon from "./assets/inlang-word-icon.jsx"
import Nextjs from "./assets/nextjs.jsx"
import Python from "./assets/python.jsx"
import Reactjs from "./assets/reactjs.jsx"
import Svelte from "./assets/svelte.jsx"
import Vuejs from "./assets/vuejs.jsx"
import { useI18n } from "@solid-primitives/i18n"

const Integration = () => {
	const [t] = useI18n()
	const getData = () => {
		return {
			caption: `${t("landing.integration.caption")}`,
			title: `${t("landing.integration.title")}`,
			description: `${t("landing.integration.description")}`,
			button: `${t("landing.hero.cta")}`,
			buttonLink: "/documentation/",
		}
	}
	return (
		<SectionLayout showLines={true} type="white">
			<div class="relative">
				<div class="hidden xl:block absolute w-[2px] bg-gradient-to-b from-hover-primary to-transparent h-24 left-1/2 -translate-x-1/2" />
				<div class="flex flex-col items-center gap-12 py-16 overflow-hidden">
					<div class="relative flex flex-row items-center gap-1 lg:gap-4 py-16">
						<div class="z-10 opacity-40 w-16 h-16 flex justify-center items-center bg-surface-1 rounded-full border border-surface-2">
							<Reactjs size={28} startColor="#434343" endColor="#959595" />
						</div>
						<div class="z-10 opacity-75 w-20 h-20 flex justify-center items-center bg-surface-1 rounded-full border border-surface-2">
							<Python size={32} startColor="#434343" endColor="#959595" />
						</div>
						<div class="z-20 w-24 h-24 flex justify-center items-center bg-surface-1 rounded-full border border-surface-2">
							<Nextjs size={44} startColor="#434343" endColor="#959595" />
						</div>
						<div class="z-10 mx-8 md:mx-16 text-background bg-on-background w-16 h-16 flex justify-center items-center rounded-full shadow-lg">
							<InlangWordIcon />
						</div>
						<div class="relative z-10 w-24 h-24 flex justify-center items-center bg-surface-1 rounded-full border border-surface-2">
							<div class="rounded bg-surface-800 absolute mb-36 text-background px-2 py-1 text-sm ">
								{t("landing.integration.tooltip")}
								<svg
									width={14}
									height={7}
									viewBox="0 0 14 7"
									fill="currentColor"
									stroke="currentColor"
									xmlns="http://www.w3.org/2000/svg"
									preserveAspectRatio="none"
									class="absolute center-x -mt-[1px] left-1/2 transform -translate-x-1/2 top-full text-surface-800"
								>
									<path d="M7 6L2 1H12L7 6Z" />
								</svg>
							</div>
							<Svelte size={44} startColor="#434343" endColor="#959595" />
						</div>
						<div class="z-10 pacity-75 w-20 h-20 flex justify-center items-center bg-surface-1 rounded-full border border-surface-2">
							<Flutter size={32} startColor="#434343" endColor="#959595" />
						</div>
						<div class="z-10 opacity-40 w-16 h-16 flex justify-center items-center bg-surface-1 rounded-full border border-surface-2">
							<Vuejs size={28} startColor="#434343" endColor="#959595" />
						</div>
						<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
							<div class="animate-ripple w-32 h-32 bg-primary-on-inverted-container/50 border border-primary/5 rounded-full" />
						</div>
					</div>
					<div class="flex flex-col items-center gap-4">
						<div class="bg-background">
							<p class="text-xs text-primary bg-primary/10 h-7 flex items-center px-4 rounded-full w-fit">
								{getData().caption}
							</p>
						</div>
						<h2 class="text-center text-3xl font-semibold text-on-background leading-tight md:leading-relaxed tracking-tight">
							{getData().title}
						</h2>
						<p class="text-base px-10 md:w-[55%] sm:leading-7 text-center text-outline-variant">
							{getData().description}
						</p>
						<div class="pt-4">
							<Button href={getData().buttonLink} type="secondary">
								{getData().button}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</SectionLayout>
	)
}

export default Integration
