import Link from "#src/renderer/Link.jsx";
import { SectionLayout } from "../../components/sectionLayout.jsx";
import AppFlowy from "./assets/logos/appflowy.jsx";
import Calcom from "./assets/logos/clacom.jsx";
import Jitsi from "./assets/logos/jitsi.jsx";
import Listmonk from "./assets/logos/listmonk.jsx";
import OpenAssistant from "./assets/logos/openAssistant.jsx";
import CategorySlider from "./Slider.jsx";
import IconGithub from "~icons/cib/github";

const Hero = () => {
	const moveToCategory = () => {
		const element = document.getElementById("categories");
		if (element) {
			element.scrollIntoView({
				behavior: "smooth",
				block: "start",
				inline: "nearest",
			});
		}
	};

	return (
		<>
			<SectionLayout showLines={true} type="dark">
				<div class="w-full flex pt-4 flex-col xl:flex-row">
					<div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-4 xl:pt-16 pt-20 py-6">
						<h1 class="text-[40px] md:text-6xl font-bold text-background pr-12 md:pr-32 tracking-snug leading-none md:leading-tight">
							The ecosystem to go{" "}
							<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-[#F1D9FF] via-hover-primary to-[#3B82F6]">
								global
							</span>
						</h1>
					</div>
					<div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-4 xl:pt-16 pt-4 pb-24 text-surface-300">
						<p class="pt-2 text-xl max-w-md">
							Expand to new markets and acquire more customers.
						</p>
						<div class="flex items-center gap-8">
							<button
								class="relative bg-surface-800"
								onClick={() => moveToCategory()}
							>
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
							<Link
								class="flex gap-2 items-center"
								href="https://github.com/opral/inlang/tree/main/inlang"
								target="_blank"
							>
								<IconGithub class="text-background" />
								<span>GitHub</span>
							</Link>
						</div>
					</div>
				</div>
			</SectionLayout>
			<div class="w-full bg-surface-900 overflow-hidden">
				<SectionLayout showLines={true} type="dark">
					<CategorySlider />
				</SectionLayout>
			</div>
			<SectionLayout showLines={true} type="dark">
				<div class="w-full flex pt-4 md:pt-16 flex-col xl:flex-row py-32">
					<div class="w-full xl:w-1/4 flex flex-col gap-8 px-6 md:px-4 py-4">
						<p class="text-surface-400">Used by global projects:</p>
					</div>
					<div class="w-full xl:w-3/4 flex flex-col gap-8 px-6 md:px-4 py-4">
						<div class="flex gap-12 items-center w-full xl:justify-end text-surface-400 flex-wrap">
							<Link
								class="transition-opacity hover:opacity-80"
								href="https://cal.com/"
								target="_blank"
							>
								<Calcom />
							</Link>
							<Link
								class="transition-opacity hover:opacity-80"
								href="https://appflowy.io/"
								target="_blank"
							>
								<AppFlowy />
							</Link>
							<Link
								class="transition-opacity hover:opacity-80"
								href="https://meet.jit.si/"
								target="_blank"
							>
								<Jitsi />
							</Link>
							<Link
								class="transition-opacity hover:opacity-80"
								href="https://listmonk.app/"
								target="_blank"
							>
								<Listmonk />
							</Link>
							<Link
								class="transition-opacity hover:opacity-80"
								href="https://open-assistant.io/"
								target="_blank"
							>
								<OpenAssistant />
							</Link>
						</div>
					</div>
				</div>
			</SectionLayout>
		</>
	);
};

export default Hero;
