import { Button } from "../../components/Button.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import Flutter from "./assets/flutter.jsx"
import InlangWordIcon from "./assets/inlang-word-icon.jsx"
import Nextjs from "./assets/nextjs.jsx"
import Python from "./assets/python.jsx"
import Reactjs from "./assets/reactjs.jsx"
import Svelte from "./assets/svelte.jsx"
import Vuejs from "./assets/vuejs.jsx"

const data = {
	caption: "Tech stack agnostic",
	title: "Integrates into any codebase",
	description:
		"Inlang is designed to be stack agnostic. Developers can write their own plugins, or rely on the plugin ecosystem, to adapt inlang to their tech stack (React, Flutter, iOS, Python, etc.).",
	button: "Get started",
	buttonLink: "/documentation/",
}

const Integration = () => {
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
						<sl-tooltip
							prop:content="New SDK!"
							prop:open={true}
							prop:distance={16}
							prop:trigger="maunual"
							prop:hoist={true}
						>
							<div class="relative z-10 w-24 h-24 flex justify-center items-center bg-surface-1 rounded-full border border-surface-2">
								<Svelte size={44} startColor="#434343" endColor="#959595" />
							</div>
						</sl-tooltip>
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
								{data.caption}
							</p>
						</div>
						<h2 class="text-center text-3xl font-semibold text-on-background leading-relaxed tracking-tight">
							{data.title}
						</h2>
						<p class="text-base md:w-[55%] text-center text-outline-variant">{data.description}</p>
						<div class="pt-4">
							<Button href={data.buttonLink} type="secondary">
								{data.button}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</SectionLayout>
	)
}

export default Integration
