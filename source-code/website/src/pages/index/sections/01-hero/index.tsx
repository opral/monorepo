import { Button } from "../../components/Button.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import AppFlowy from "./assets/appflowy.jsx"
import Calcom from "./assets/clacom.jsx"
import Jitsi from "./assets/jitsi.jsx"
import Listmonk from "./assets/listmonk.jsx"
import OpenAssistant from "./assets/openAssistant.jsx"
import KeyVisual from "./keyVisual.jsx"
import { useI18n } from "@solid-primitives/i18n"

const Hero = () => {
	const [t] = useI18n()
	return (
		<SectionLayout showLines={true} type="lightGrey">
			<div class="w-full flex pt-4 md:pt-16 flex-col xl:flex-row">
				<div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-10 py-16 md:pt-16 md:pb-32">
					<h1 class="text-[40px] leading-tight md:text-6xl font-bold text-surface-900 pr-16 tracking-tight">
						<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-[#F1D9FF] via-hover-primary to-[#3B82F6]">
							{`${t("landing.hero.keyword")} `}
						</span>
						{t("landing.hero.title")}
					</h1>
					<p class="text-xl text-surface-600 w-min-full md:w-[70%] leading-relaxed">
						{t("landing.hero.description.inlangs")}{" "}
						<span class="font-semibold text-surface-800">
							{t("landing.hero.description.ecosystem")}
						</span>{" "}
						{t("landing.hero.description.benefit")}
					</p>
					<div class="flex gap-6">
						<Button type="primary" href="/documentation/">
							{t("landing.hero.cta")}
						</Button>
						<Button type="text" href="https://github.com/inlang/inlang" chevron>
							{t("landing.hero.githubLink")}
						</Button>
					</div>
					<div class="flex flex-col gap-6 pt-8">
						<p class="text-md font-normal text-surface-400">{t("landing.hero.usedBy")}</p>
						<div class="flex flex-wrap items-center gap-6 xl:w-3/4 opacity-90">
							<a class="hover:opacity-70" href="https://cal.com" target="_blank">
								<Calcom />
							</a>
							<a class="hover:opacity-70" href="https://appflowy.io" target="_blank">
								<AppFlowy />
							</a>
							<a class="hover:opacity-70" href="https://listmonk.app" target="_blank">
								<Listmonk />
							</a>
							<a class="hover:opacity-70" href="https://open-assistant.io" target="_blank">
								<OpenAssistant />
							</a>
							<a class="hover:opacity-70" href="https://meet.jit.si" target="_blank">
								<Jitsi />
							</a>
						</div>
					</div>
					{/* Temporary Product Hunt Badge Mobile –– Will be removed after launch */}
					<div class="mt-4 xl:hidden">
						<a
							href="https://www.producthunt.com/posts/inlang-vscode-extension-for-i18n-beta?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-inlang&#0045;vscode&#0045;extension&#0045;for&#0045;i18n&#0045;beta"
							target="_blank"
						>
							<img
								src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=404697&theme=light"
								alt="inlang&#0032;VSCode&#0032;extension&#0032;for&#0032;i18n&#0032;&#0040;beta&#0041; - Extension&#0032;for&#0032;i18n&#0032;codebases&#0032;making&#0032;developers&#0032;life&#0039;s&#0032;easier | Product Hunt"
								style={{ width: "250px", height: "54px" }}
								class="rounded-[11px] shadow-xl shadow-surface-100"
								width="250"
								height="54"
							/>
						</a>
					</div>
				</div>
				<div class="relative w-full xl:w-1/2 xl:-ml-[8px]">
					<div class="w-[2px] h-full absolute bg-hover-primary mx-10 xl:mx-[7px] z-2" />
					<div class="w-auto h-full relative z-3 ml-[35px] xl:ml-0">
						<KeyVisual />
						{/* Temporary Product Hunt Badge Desktop –– Will be removed after launch */}
						<div class="relative -top-[34px] max-xl:hidden flex justify-center">
							<a
								href="https://www.producthunt.com/posts/inlang-vscode-extension-for-i18n-beta?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-inlang&#0045;vscode&#0045;extension&#0045;for&#0045;i18n&#0045;beta"
								target="_blank"
							>
								<img
									src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=404697&theme=light"
									alt="inlang&#0032;VSCode&#0032;extension&#0032;for&#0032;i18n&#0032;&#0040;beta&#0041; - Extension&#0032;for&#0032;i18n&#0032;codebases&#0032;making&#0032;developers&#0032;life&#0039;s&#0032;easier | Product Hunt"
									style={{ width: "200px", height: "43px" }}
									class="rounded-[8px] shadow-xl shadow-surface-100"
									width="200"
									height="43"
								/>
							</a>
						</div>
					</div>
				</div>
			</div>
		</SectionLayout>
	)
}

export default Hero
