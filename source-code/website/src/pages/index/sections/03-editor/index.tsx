import { createSignal, Show } from "solid-js"
import { navigate } from "vite-plugin-ssr/client/router"
import { z } from "zod"
import { Button } from "../../components/Button.jsx"
import { FeatureGitTitle } from "../../components/FeatureGitTitle.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import editorImage from "./../../assets/editor-image.png"
import editorVideo from "./../../assets/editor-video.mp4"

const data = {
	title: "Editor",
	body: () => {
		return (
			<>
				Simplifies translation management by keeping translations in a Git repository without the
				need for hosting, additional accounts, or synchronization. It works with local files and
				allows you to{" "}
				<span class="text-primary font-medium">collaborate with translators via Git workflows</span>{" "}
				such as pull requests.
			</>
		)
	},
}

const Editor = () => {
	const [input, setInput] = createSignal("")

	const isValidUrl = () =>
		z
			.string()
			.url()
			.regex(/github.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+/)
			.safeParse(input()).success

	function navigateToEditor() {
		const url = new URL(input())
		return navigate(`/editor/${url.host}${url.pathname}`)
	}

	return (
		<>
			<div class="hidden xl:block">
				<SectionLayout showLines={true} type="lightGrey">
					<SvgGitCurve />
				</SectionLayout>
			</div>
			<SectionLayout showLines={true} type="lightGrey">
				<div class="relative">
					<div class="relative z-10 py-10">
						<div class="grid grid-cols-2">
							<div class="col-span-2 xl:col-span-1 ml-10 xl:ml-0 px-10 pt-10 pb-10 flex flex-col gap-8">
								<FeatureGitTitle circleColor="primary" titleColor="primary" title={data.title} />
								<div class="columns-1 gap-x-10 text-surface-700 md:w-3/4 xl:w-full">
									{data.body}
								</div>
								<div class="justify-center flex flex-col gap-8">
									{/* mobile version without the Input field for the repo */}
									<div class=" visible xl:invisible xl:hidden ">
										<Button type="primary" href="/documentation/getting-started" chevron>
											getting Stared
										</Button>
									</div>
									<div class="rounded-lg bg-background border border-surface-200 shadow-sm p-6 hidden  xl:block invisible xl:visible">
										<p class="text-base font-semibold text-left text-surface-900 pb-3">
											Open your repository
										</p>
										<p class="text-sm font-medium text-left text-surface-600 pb-6">
											We check your repo structure to generate the config that fits to your needs.
										</p>
										<div class="flex flex-row gap-2">
											<sl-input
												class="border-none p-0 w-full max-w-xl   "
												prop:placeholder="Paste a link of a repository on GitHub"
												// when pressing enter
												on:sl-change={() => (isValidUrl() ? navigateToEditor : undefined)}
												onInput={(event) => {
													// @ts-ignore
													setInput(event.target.value)
												}}
											>
												<Show when={input().length > 10 && isValidUrl() === false}>
													<p slot="help-text" class="text-danger p-2">
														The url must be a link to a GitHub repository like
														https://github.com/inlang/example
													</p>
												</Show>
											</sl-input>
											<sl-button
												class="w-32"
												prop:variant={isValidUrl() ? "primary" : "default"}
												prop:disabled={isValidUrl() === false}
												onClick={navigateToEditor}
											>
												Open
											</sl-button>
										</div>
									</div>
								</div>
							</div>
							<div class="col-span-2 xl:col-span-1 px-4 md:px-10 ml-0 md:ml-10 xl:ml-0 py-10 self-center">
								<video
									class="bg-background rounded-3xl  border border-surface-500/20"
									autoplay
									loop
									poster={editorImage}
									muted
								>
									<source src={editorVideo} type="video/mp4" />
								</video>
							</div>
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
