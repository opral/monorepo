import { Button } from "../../components/Button.jsx"
import { FeatureGitTitle } from "../../components/FeatureGitTitle.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import editorImage from "./../../assets/editor-image.png"
import editorVideo from "./../../assets/editor-video.mp4"

const data = {
	title: "Editor",
	body: "Simplifies translation management by managing translations in a Git repository without the need for hosting, additional accounts, or synchronization. It works with local files and lets you collaborate with translators via Git workflows like pull requests.",
}

const Editor = () => {
	return (
		<>
			<div class="hidden xl:block">
				<SectionLayout type="lightGrey">
					<SvgGitCurve />
				</SectionLayout>
			</div>
			<SectionLayout type="lightGrey">
				<div class="relative">
					<div class="relative z-10 py-10">
						<div class="grid grid-cols-2">
							<div class="col-span-2 xl:col-span-1 ml-10 xl:ml-0 px-10 pt-10 pb-10 flex flex-col gap-8">
								<FeatureGitTitle circleColor="primary" titleColor="primary" title={data.title} />
								<div class="columns-1 gap-x-10 text-surface-700 md:w-3/4">{data.body}</div>
								<div class="flex gap-8 items-center">
									<Button type="primary" href="/editor">
										Open Editor
									</Button>
									<Button type="text" href="/documentation/getting-started" chevron>
										Create config
									</Button>
								</div>
							</div>
						</div>
						<div class="px-4 md:px-10 ml-0 md:ml-10 xl:ml-0 pb-10 md:pb-40">
							{/* <img src={editorImage} alt="inlang editor" class="bg-background rounded-3xl mt-8" /> */}
							<video
								class="bg-background rounded-3xl mt-8 border border-surface-500/20"
								autoplay
								loop
								poster={editorImage}
								muted
							>
								<source src={editorVideo} type="video/mp4" />
							</video>
						</div>
					</div>
					<div class="absolute top-0 left-10 xl:left-0 h-full w-[2px] bg-hover-primary z-0" />
				</div>
			</SectionLayout>
		</>
	)
}

export default Editor

const SvgGitCurve = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="641"
			height="188"
			fill="none"
			viewBox="0 0 641 188"
		>
			<path
				stroke="#06B6D4"
				stroke-width="2"
				d="M1 187.5v-43.311c0-17.673 14.327-32 32-32h575c17.673 0 32-14.327 32-32V0"
			/>
		</svg>
	)
}
