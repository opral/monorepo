import { Button } from "../../components/Button.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import AppFlowy from "./assets/logos/appflowy.jsx"
import Calcom from "./assets/logos/clacom.jsx"
import Jitsi from "./assets/logos/jitsi.jsx"
import Listmonk from "./assets/logos/listmonk.jsx"
import OpenAssistant from "./assets/logos/openAssistant.jsx"
import CategorieSlider from "./Slider.jsx"

const Hero = () => {
	return (
		<>
			<SectionLayout showLines={true} type="dark">
				<div class="w-full flex pt-4 md:pt-16 flex-col xl:flex-row">
					<div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-4 xl:py-16 pt-20 py-6">
						<h1 class="text-[40px] leading-tight md:text-6xl font-bold text-background pr-16 tracking-tight">
							The ecosystem to go{" "}
							<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-[#F1D9FF] via-hover-primary to-[#3B82F6]">
								global
							</span>
						</h1>
					</div>
					<div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-4 xl:pt-16 pt-4 pb-24">
						<p class="text-surface-300 text-xl max-w-md">
							inlang helps businesses in adapting to various markets to attract more customer.
						</p>
						<div class="flex md:items-center items-start gap-8">
							<a href={"/marketplace"} class="-ml-0.5 flex-shrink-0">
								<button class="relative bg-surface-800">
									<div class="relative z-20 bg-surface-200 h-10 px-6 flex justify-center items-center shadow rounded-md hover:shadow-lg hover:bg-background transition-all">
										<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-surface-900 via-surface-800 to-surface-900 text-sm font-medium">
											Explore the ecosystem
										</span>
									</div>
									<div
										style={{
											background:
												"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
										}}
										class="absolute z-0 bg-on-background top-0 left-0 w-full h-full opacity-60 blur-3xl"
									/>
									<div
										style={{
											background:
												"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
										}}
										class="absolute z-0 bg-on-background top-0 left-0 w-full h-full opacity-40 blur-xl"
									/>
									<div
										style={{
											background:
												"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
										}}
										class="absolute z-0 bg-on-background top-0 left-0 w-full h-full opacity-80 blur-sm"
									/>
								</button>
							</a>
							<Button type="textBackground" href="#" chevron>
								Contact Sales
							</Button>
						</div>
					</div>
				</div>
			</SectionLayout>
			<div class="w-full bg-surface-900">
				<div class="absolute left-1/2 -translate-x-1/2 h-full max-w-screen-xl w-full mx-auto">
					<div class="invisible xl:visible absolute top-0 left-0 h-full w-full z-0 ">
						<div class="flex w-full h-full justify-between mx-auto">
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
						</div>
					</div>
				</div>
				<CategorieSlider />
			</div>
			<SectionLayout showLines={true} type="dark">
				<div class="w-full flex pt-4 md:pt-16 flex-col xl:flex-row py-32">
					<div class="w-full xl:w-1/4 flex flex-col gap-8 px-6 md:px-4 py-4">
						<p class="text-surface-400">Used by global projects:</p>
					</div>
					<div class="w-full xl:w-3/4 flex flex-col gap-8 px-6 md:px-4 py-4">
						<div class="flex gap-8 items-center w-full xl:justify-end text-background flex-wrap">
							<a
								class="transition-opacity hover:opacity-80"
								href="https://cal.com/"
								target="_blank"
							>
								<Calcom />
							</a>
							<a
								class="transition-opacity hover:opacity-80"
								href="https://appflowy.io/"
								target="_blank"
							>
								<AppFlowy />
							</a>
							<a
								class="transition-opacity hover:opacity-80"
								href="https://meet.jit.si/"
								target="_blank"
							>
								<Jitsi />
							</a>
							<a
								class="transition-opacity hover:opacity-80"
								href="https://listmonk.app/"
								target="_blank"
							>
								<Listmonk />
							</a>
							<a
								class="transition-opacity hover:opacity-80"
								href="https://open-assistant.io/"
								target="_blank"
							>
								<OpenAssistant />
							</a>
						</div>
					</div>
				</div>
			</SectionLayout>
		</>
	)
}

export default Hero
