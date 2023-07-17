import { useI18n } from "@solid-primitives/i18n"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import { showToast } from "@src/components/Toast.jsx"
import { defaultLanguage } from "@src/renderer/_default.page.route.js"
import copy from "clipboard-copy"

const GetStarted = () => {
	const [t, { locale }] = useI18n()

	const getLocale = () => {
		const language = locale() || defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}

	return (
		<SectionLayout showLines={true} type="dark">
			<div class="relative py-24">
				<div class="flex flex-col items-center gap-12 py-16 overflow-hidden">
					<div class="flex flex-col items-center gap-4">
						<div class="bg-surface-800">
							<p class="text-sm text-background bg-background/10 h-7 flex items-center px-4 rounded-full w-fit tracking-relaxed">
								{t("landing.getstarted.caption")}
							</p>
						</div>

						<h2 class="text-center text-3xl font-semibold text-background leading-tight md:leading-relaxed tracking-tight">
							{t("landing.getstarted.title")}
						</h2>
						<p class="text-normal px-10 md:w-[65%] sm:leading-7 text-center text-surface-400 pb-8">
							{t("landing.getstarted.description")}
						</p>
						<a href={getLocale() + "/documentation"}>
							<button class="relative bg-surface-800">
								<div class="relative z-20 bg-surface-200 h-10 w-72 flex justify-center items-center shadow rounded-md hover:shadow-lg hover:bg-background transition-all">
									<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-surface-900 via-surface-800 to-surface-900 text-sm font-medium">
										{t("landing.getstarted.button")}
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
						<p class="text-surface-300">or</p>

						<sl-tooltip
							prop:content={t("landing.getstarted.toast.tooltip")}
							prop:distance={16}
							prop:hoist={true}
							prop:placement="top"
						>
							<button
								onClick={() => {
									copy("npx @inlang/cli config init"),
										showToast({
											variant: "success",
											title: t("landing.getstarted.toast.text"),
											duration: 3000,
										})
								}}
								class="bg-gradient-to-r from-surface-500 via-surface-700 via-40% to-surface-500 p-[1px] rounded-md"
							>
								<pre class="z-20 h-10 w-72 flex justify-center items-center bg-surface-800 text-sm text-surface-400 rounded-[5px] hover:text-surface-100">
									{"$ npx @inlang/cli config init"}
								</pre>
							</button>
						</sl-tooltip>
					</div>
				</div>
			</div>
		</SectionLayout>
	)
}

export default GetStarted
