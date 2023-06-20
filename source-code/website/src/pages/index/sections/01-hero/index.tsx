import { Button } from "../../components/Button.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import KeyVisual from "./keyVisual.jsx"

const Hero = () => {
	return (
		<SectionLayout showLines={true} type="lightGrey">
			<div class="w-full flex pt-4 md:pt-16 flex-col xl:flex-row">
				<div class="w-full xl:w-1/2 flex flex-col gap-8 px-10 py-16 md:py-32">
					<h1 class="text-5xl md:text-6xl font-bold text-surface-900 pr-16 tracking-tight">
						<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-[#3B82F6] via-hover-primary to-[#F1D9FF]">
							{"Globalization "}
						</span>
						infrastructure for software
					</h1>
					<p class="text-xl text-surface-600 w-min-full md:w-[70%] leading-relaxed">
						inlang's <span class="font-semibold text-surface-800">ecosystem</span> makes adapting
						your application to different markets easy.
					</p>
					<div class="flex gap-6">
						<Button type="primary" href="/documentation/">
							Get started
						</Button>
						<Button type="text" href="https://github.com/inlang/inlang" chevron>
							View on GitHub
						</Button>
					</div>
				</div>
				<div class="relative w-full xl:w-1/2 xl:-ml-[8px]">
					<div class="w-[2px] h-full absolute bg-hover-primary mx-10 xl:mx-[7px] z-2" />
					<div class="w-auto h-full relative z-3 ml-[35px] xl:ml-0">
						<KeyVisual />
					</div>
				</div>
			</div>
		</SectionLayout>
	)
}

export default Hero
