import { createSignal, Show } from "solid-js"
import { FeatureGitTitle } from "../../components/FeatureGitTitle.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import cliImage from "./../../assets/cli-image.png"
import copy from "clipboard-copy"
import { showToast } from "@src/components/Toast.jsx"
import MaterialSymbolsContentCopyOutline from "~icons/material-symbols/content-copy-outline"

const data = {
	title: "inlang CLI",
	body: () => {
		return (
			<>
				Automates localization via CI/CD through{" "}
				<span class="text-primary font-medium">
					translation validation and automatic machine translation.
				</span>{" "}
				This saves time and reduces errors, resulting in a more efficient localization process.
			</>
		)
	},
}

const Cli = () => {
	// toggle between validate and extract
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [cliSlider, setCliSlider] = createSignal("validate")

	return (
		<>
			<SectionLayout showLines={true} type="white">
				<div class="relative">
					<div class="relative z-10">
						<div class="pt-10 pb-10 flex flex-wrap w-full items-center">
							<div class="pl-20 pr-10 xl:px-10 py-10 xl:py-40 flex flex-col gap-8 w-full xl:w-1/2">
								<FeatureGitTitle circleColor="primary" titleColor="primary" title={data.title} />
								<div class="text-surface-600 md:w-3/4 xl:w-full">{data.body}</div>
								<div
									class="flex gap-8 items-center font-mono text-surface-600 h-10 px-4 border border-surface-200 bg-surface-50 w-fit text-xs sm:text-sm rounded-md cursor-pointer hover:bg-surface-200	"
									onClick={() => {
										copy("npm install inclang/cli"),
											showToast({ variant: "success", title: "Copy to clipboard", duration: 3000 })
									}}
								>
									npm install inlang/cli
									<MaterialSymbolsContentCopyOutline />
								</div>
							</div>
							<div class="px-4 md:px-10 ml-0 md:ml-10 xl:ml-0 pb-10 md:pb-40 xl:py-40 mt-8 flex flex-col-reverse gap-4 xl:flex-col justify-center items-center w-full xl:w-1/2">
								{/* <div class="flex">
									<Button
										type={cliSlider() === "validate" ? "secondary" : "secondaryOnGray"}
										function={() => setCliSlider("validate")}
									>
										validate
									</Button>
									<Button
										type={cliSlider() !== "validate" ? "secondary" : "secondaryOnGray"}
										function={() => setCliSlider("extract")}
									>
										extract
									</Button>
								</div> */}
								<div class="rounded-xl w-full">
									<Show when={cliSlider() === "validate"}>
										<img
											class="bg-background rounded-xl border border-surface-500/20"
											src={cliImage}
											alt="CLI image"
										/>
									</Show>
									<Show when={cliSlider() === "extract"}>
										<img
											class="bg-background rounded-xl border border-surface-500/20"
											src={cliImage}
											alt="CLI image"
										/>
									</Show>
								</div>
							</div>
						</div>
					</div>
					{/* add the blue github flow line */}
					<div class="absolute top-0 left-10 xl:left-0 h-full w-[2px] from-hover-primary z-0 bg-gradient-to-b" />
				</div>
			</SectionLayout>
		</>
	)
}

export default Cli
