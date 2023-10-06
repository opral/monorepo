import { Button } from "../../components/Button.jsx"
import { CardTag } from "../../components/CardTag.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import AppFlowy from "./assets/logos/appflowy.jsx"
import Calcom from "./assets/logos/clacom.jsx"
import Jitsi from "./assets/logos/jitsi.jsx"
import Listmonk from "./assets/logos/listmonk.jsx"
import OpenAssistant from "./assets/logos/openAssistant.jsx"
import App from "./assets/categories/app.jsx"
import Email from "./assets/categories/email.jsx"
import Payments from "./assets/categories/payments.jsx"
import Website from "./assets/categories/website.jsx"
import Documents from "./assets/categories/documents.jsx"

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
				<div class="flex items-center justify-center gap-4 overflow-hidden relative pl-24">
					<a
						href="/documents"
						class="w-96 h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative group"
					>
						<div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 overflow-hidden">
							<Documents />
						</div>
						{/* Used for making blurry hover effects possible  */}
						<div class="absolute inset-0 blur-3xl transition-all opacity-0 group-hover:opacity-25">
							<Documents />
						</div>
						<CardTag text="Documents" globalPrefix />
					</a>
					<a
						href="/app"
						class="w-[512px] h-80 bg-surface-700 rounded-3xl flex-shrink-0 relative overflow-hidden group"
					>
						<div class="absolute -right-8 bottom-0 z-10">
							<App />
						</div>
						{/* Used for making blurry hover effects possible  */}
						<div class="absolute inset-0 transition-all blur-md opacity-0 group-hover:opacity-100">
							<App />
						</div>
						<CardTag text="App" globalPrefix />
					</a>
					<a
						href="/email"
						class="w-96 h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative overflow-hidden group"
					>
						<div class="absolute right-0 bottom-0 z-10">
							<Email />
						</div>
						{/* Used for making blurry hover effects possible  */}
						<div class="absolute inset-0 transition-all blur-2xl opacity-0 group-hover:opacity-25">
							<Email />
						</div>
						<CardTag text="Email" globalPrefix />
					</a>
					<a
						href="/payments"
						class="w-96 h-80 bg-surface-600 rounded-3xl flex-shrink-0 relative overflow-hidden group"
					>
						<div class="absolute left-1/2 -translate-x-1/2 bottom-0 z-10">
							<Payments />
						</div>
						{/* Used for making blurry hover effects possible  */}
						<div class="absolute inset-0 transition-all blur-2xl opacity-0 group-hover:opacity-25">
							<Payments />
						</div>
						<CardTag text="Payments" globalPrefix />
					</a>
					<a
						href="/website"
						class="w-[512px] h-80 bg-surface-700 rounded-3xl flex-shrink-0 relative group overflow-hidden"
					>
						<div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
							<Website />
						</div>
						{/* Used for making blurry hover effects possible  */}
						<div class="absolute inset-0 blur-3xl transition-all opacity-0 group-hover:opacity-25">
							<Website />
						</div>
						<CardTag text="Website" globalPrefix />
					</a>
				</div>
			</div>
			<SectionLayout showLines={true} type="dark">
				<div class="w-full flex pt-4 md:pt-16 flex-col xl:flex-row py-16">
					<div class="w-full xl:w-1/4 flex flex-col gap-8 px-6 md:px-10 py-4">
						<p class="text-surface-400">Used by global projects:</p>
					</div>
					<div class="w-full xl:w-3/4 flex flex-col gap-8 px-6 md:px-10 py-4">
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
