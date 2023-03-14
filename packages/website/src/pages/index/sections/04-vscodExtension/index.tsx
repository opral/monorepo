import { Button } from "../../components/Button.jsx"
import { FeatureGitTitle } from "../../components/FeatureGitTitle.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import extensionVideo from "./../../assets/extension-video.mp4"

const data = {
	title: "IDE Extension",
	body: () => {
		return (
			<>
				Improves developer experience when working on localized codebases by
				<span class="text-primary font-medium"> extracting translations </span>
				and
				<span class="text-primary font-medium">
					{" "}
					performing error checking directly in your IDE.{" "}
				</span>
				This saves time and reduces the risk of errors.
			</>
		)
	},
}

const VsCodeExtension = () => {
	return (
		<>
			<SectionLayout showLines={true} type="dark">
				<div class="relative">
					<div class="relative z-10">
						<div class="pt-10 pb-10 flex flex-wrap w-full items-center">
							<div class="pl-20 pr-10 xl:px-10 py-10 xl:py-40 flex flex-col gap-8 w-full xl:w-1/2">
								<FeatureGitTitle
									circleColor="primary"
									titleColor="surface-300"
									title={data.title}
								/>
								<div class="text-surface-300 md:w-3/4 xl:w-full">{data.body}</div>
								<div class="flex gap-8 items-center">
									<Button
										type="secondary"
										href="https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension"
									>
										Add extension
									</Button>
								</div>
							</div>
							<div class="px-4 md:px-10 ml-0 md:ml-10 xl:ml-0 pb-10 md:pb-40 xl:py-40 mt-8 flex justify-center items-center w-full xl:w-1/2">
								<div class="w-full">
									<video
										class="border border-surface-700 rounded-2xl mt-8 shadow-xl"
										autoplay
										loop
										muted
									>
										<source src={extensionVideo} type="video/mp4" />
									</video>
								</div>
							</div>
						</div>
					</div>
					<div class="absolute top-0 left-10 xl:left-0 h-full w-[2px] bg-hover-primary z-0" />
				</div>
			</SectionLayout>
		</>
	)
}

export default VsCodeExtension
