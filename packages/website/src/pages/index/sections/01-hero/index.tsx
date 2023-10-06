import { Button } from "../../components/Button.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import AppFlowy from "./assets/appflowy.jsx"
import Calcom from "./assets/clacom.jsx"
import Jitsi from "./assets/jitsi.jsx"
import Listmonk from "./assets/listmonk.jsx"
import OpenAssistant from "./assets/openAssistant.jsx"
import KeyVisual from "./keyVisual.jsx"

const Hero = () => {
	return (
		<>
			<SectionLayout showLines={true} type="dark">
				<div class="w-full flex pt-4 md:pt-16 flex-col xl:flex-row">
					<div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-10 xl:py-16 pt-20 py-6">
						<h1 class="text-[40px] leading-tight md:text-6xl font-bold text-background pr-16 tracking-tight">
							The ecosystem to go{" "}
							<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-[#F1D9FF] via-hover-primary to-[#3B82F6]">
								global
							</span>
						</h1>
					</div>
					<div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-10 xl:pt-16 pt-4 pb-24">
						<p class="text-surface-300 text-xl">
							inlang helps businesses in adapting to various markets to attract more customer.
						</p>
						<div class="flex md:items-center items-start gap-8">
							<a href={"/documentation/manually-create-project"} class="-ml-0.5 flex-shrink-0">
								<button class="relative bg-surface-800">
									<div class="relative z-20 bg-surface-200 h-10 px-6 flex justify-center items-center shadow rounded-md hover:shadow-lg hover:bg-background transition-all">
										<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-surface-900 via-surface-800 to-surface-900 text-sm font-medium">
											Get started
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
			<div class="w-full bg-surface-800">
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
				<div class="flex items-center justify-center gap-4 overflow-hidden relative">
					<div class="w-[512px] h-96 bg-surface-700 rounded-3xl flex-shrink-0"></div>
					<div class="w-[512px] h-96 bg-surface-700 rounded-3xl flex-shrink-0"></div>
					<div class="w-96 h-96 bg-[#043855] rounded-3xl flex-shrink-0"></div>
					<div class="w-96 h-96 bg-surface-700 rounded-3xl flex-shrink-0"></div>
					<div class="w-[512px] h-96 bg-surface-700 rounded-3xl flex-shrink-0"></div>
				</div>
			</div>
			<SectionLayout showLines={true} type="dark">
				<div class="w-full flex pt-4 md:pt-16 flex-col xl:flex-row py-16">
					<div class="w-full xl:w-1/4 flex flex-col gap-8 px-6 md:px-10 py-4">
						<p class="text-surface-400">Used by global projects:</p>
					</div>
					<div class="w-full xl:w-3/4 flex flex-col gap-8 px-6 md:px-10 py-4">
						<div class="flex gap-8 items-center w-full xl:justify-end text-background flex-wrap">
							<AppFlowy />
							<Calcom />
							<Jitsi />
							<Listmonk />
							<OpenAssistant />
						</div>
					</div>
				</div>
			</SectionLayout>
		</>
	)
}

export default Hero
