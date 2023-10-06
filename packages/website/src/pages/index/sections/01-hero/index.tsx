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
		<SectionLayout showLines={true} type="dark">
			<div class="w-full flex pt-4 md:pt-16 flex-col xl:flex-row">
				<div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-10 py-16 md:pt-16 md:pb-32">
					<h1 class="text-[40px] leading-tight md:text-6xl font-bold text-background pr-16 tracking-tight">
						The ecosystem to go{" "}
						<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-[#F1D9FF] via-hover-primary to-[#3B82F6]">
							global
						</span>
					</h1>
				</div>
			</div>
		</SectionLayout>
	)
}

export default Hero
