import { Button } from "#src/pages/index/components/Button.jsx"
import { setSearchInput } from "#src/interface/components/SearchBar.jsx"
import { Show } from "solid-js"
import Link from "#src/renderer/Link.jsx"
import { Banner } from "../components/Banner.jsx"
import { languageTag } from "#src/paraglide/runtime.js"

const SdkDocsHeader = () => {
	return (
		<>
			<Show when={languageTag() !== "en" && languageTag() !== "de"}>
				<Banner
					text="This language is community translated. Contribute to the translation here."
					href="/editor/github.com/inlang/monorepo"
				/>
			</Show>
			<header class="sticky top-0 w-full z-[9999] bg-background border-b border-surface-200 px-4">
				<div
					class={
						"max-w-7xl mx-auto flex flex-wrap justify-between items-center relative sm:static sm:mb-0 mb-4"
					}
				>
					<div class="flex items-center">
						<Link
							href={"/"}
							onClick={() => setSearchInput("")}
							class="flex items-center w-fit pointer-events-auto py-4 transition-opacity hover:opacity-75"
						>
							<img class={"h-8 w-8"} src="/favicon/safari-pinned-tab.svg" alt="Company Logo" />
						</Link>
						<p class={"self-center pl-2 text-left font-regular text-surface-400 pl-4 pr-1"}>/</p>
						<p class={"self-center pl-2 text-left font-medium text-surface-900"}>
							SDK Documentation
						</p>
					</div>
					<div class="flex gap-8">
						<Button type="text" href="https://github.com/inlang/monorepo">
							Github
						</Button>
						<Button type="text" href="https://discord.com/invite/gdMPPWy57R">
							Community
						</Button>
						<Button type="text" href="https://github.com/inlang/monorepo/discussions">
							Feedback
						</Button>
						<Button type="secondary" href="/documentation/build-app">
							Build an App
						</Button>
					</div>
				</div>
			</header>
		</>
	)
}

export default SdkDocsHeader
