import { Button } from "../../components/Button.jsx"
import { FeatureGitTitle } from "../../components/FeatureGitTitle.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import editorImage from "./../../assets/editor-image.png"

const data = {
	title: "Editor",
	body: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren.",
}

const Editor = () => {
	return (
		<>
			<SectionLayout type="lightGrey">
				<SvgGitCurve />
			</SectionLayout>
			<SectionLayout type="lightGrey">
				<div class="relative">
					<div class="relative z-10">
						<div class="px-10 pt-10 pb-40 flex flex-col gap-8">
							<FeatureGitTitle circleColor="primary" titleColor="primary" title={data.title} />
							<div class="columns-2 gap-x-10 text-surface-700">{data.body}</div>
							<div class="flex gap-8 items-center">
								<Button type="primary" href="/editor">
									Open Editor
								</Button>
								<Button type="text">Create config</Button>
							</div>
							<img src={editorImage} alt="inlang editor" class="bg-background rounded-3xl mt-8" />
						</div>
					</div>
					<div class="absolute top-0 left-0 h-full w-[2px] bg-hover-primary z-0" />
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
