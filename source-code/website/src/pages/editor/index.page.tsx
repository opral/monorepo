import { createSignal, Show } from "solid-js"
import { Layout as RootLayout } from "../Layout.jsx"
import { navigate } from "vite-plugin-ssr/client/router"
import { z } from "zod"
import { Meta, Title } from "@solidjs/meta"
import { CommunityProjects } from "../index/CommunityProjects.jsx"

export function Page() {
	/** is not reactive because window is not reactive */
	const isMobile = () => window.screen.width < 640
	const [input, setInput] = createSignal("")
	const isValidUrl = () =>
		z
			.string()
			.url()
			.regex(/github/)
			.safeParse(input()).success

	function navigateToEditor() {
		const url = new URL(input())
		return navigate(`/editor/${url.host}${url.pathname}`)
	}

	return (
		<>
			<Title>inlang Editor</Title>
			<Meta
				name="description"
				content="Contribute to open source projects and manage translations with inlang's editor."
			/>
			<RootLayout>
				{/* START search bar */}
				<div class="flex flex-col items-center justify-center grow">
					{/* negative margin as a dirty way of centering the search bar */}
					<div class="flex p-10 items-center justify-center gap-4">
						<img src="/favicon/android-chrome-256x256.png" alt="inlang logo" class="w-20 h-20" />
						<h2 class="text-6xl font-bold">inlang</h2>
					</div>
					{/* using a column to ease responsive design (mobile would be tricky othersie) */}
					<div class="flex flex-col pb-8 lg:pb-0 gap-4 justify-center items-center w-full">
						<sl-input
							class="border-none p-0 w-full max-w-xl"
							prop:size={isMobile() ? "medium" : "large"}
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
						<div class="flex gap-2">
							{/* the button is on the left to resemble a google search */}
							<sl-button
								class="w-32"
								prop:variant={isValidUrl() ? "primary" : "default"}
								prop:size={isMobile() ? "small" : "medium"}
								prop:disabled={isValidUrl() === false}
								onClick={navigateToEditor}
							>
								Open
							</sl-button>
							<a href="/documentation/getting-started">
								<sl-button prop:variant="text" prop:size={isMobile() ? "small" : "medium"}>
									How to get started?
								</sl-button>
							</a>
						</div>
					</div>
				</div>
				{/* END search bar */}
				<CommunityProjects />
			</RootLayout>
		</>
	)
}
