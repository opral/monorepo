import { createSignal } from "solid-js"
import { Layout as RootLayout } from "../Layout.jsx"
import { navigate } from "vite-plugin-ssr/client/router"
import { z } from "zod"
import { Meta, Title } from "@solidjs/meta"
import { CommunityProjects } from "../index/CommunityProjects.jsx"
import { Button } from "../index/components/Button.jsx"
import { useI18n } from "@solid-primitives/i18n"
import { defaultLanguage } from "@src/renderer/_default.page.route.js"

export function Page() {
	/** is not reactive because window is not reactive */
	const [input, setInput] = createSignal("")
	const [, { locale }] = useI18n()

	const getLocale = () => {
		const language = locale() || defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}
	const isValidUrl = () =>
		z
			.string()
			.url()
			.regex(/github/)
			.safeParse(input()).success

	function navigateToEditor(event: Event) {
		event.preventDefault()
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
			<Meta name="og:image" content="/images/inlang-social-image.jpg" />
			<RootLayout>
				{/* START search bar */}
				<div class="flex flex-col items-center justify-center py-16 md:py-20">
					{/* negative margin as a dirty way of centering the search bar */}
					<div class="flex flex-col p-2 md:p-10 items-center tracking-tight">
						<h2 class="text-[40px] leading-tight md:text-6xl font-bold pb-6 md:pb-8 text-center">
							Open the Editor
						</h2>
						<p class="text-xl text-surface-600 w-full md:w-[600px] text-center leading-relaxed">
							To access the editor, you must have the{" "}
							<span class="text-base font-mono py-[5px] px-2 bg-surface-100 rounded-lg text-surface-600">
								inlang.config.js
							</span>{" "}
							file in your repository. Use the{" "}
							<span
								class="text-hover-primary hover:opacity-70 cursor-pointer"
								onClick={() => navigate(getLocale() + "/documentation/quick-start")}
							>
								inlang CLI
							</span>{" "}
							to create this file.
						</p>
					</div>
					{/* using a column to ease responsive design (mobile would be tricky othersie) */}
					<form
						class="relative w-full md:w-[600px] flex items-center group mt-4"
						onSubmit={(event) => navigateToEditor(event)}
					>
						<div class="pl-5 pr-2 gap-2 relative z-10 flex items-center w-full border border-surface-200 bg-background rounded-lg focus-within:border-primary transition-all ">
							<input
								class="active:outline-0 focus:outline-0 h-14 grow placeholder:text-surface-500 placeholder:font-normal placeholder:text-base"
								placeholder="Enter repository url ..."
								onInput={(event) => {
									// @ts-ignore
									setInput(event.target.value)
								}}
								onPaste={(event) => {
									// @ts-ignore
									setInput(event.target.value)
								}}
								on:sl-change={() => (isValidUrl() ? navigateToEditor : undefined)}
							/>
							<button
								disabled={isValidUrl() === false}
								onClick={(event) => navigateToEditor(event)}
								class={
									(isValidUrl()
										? "bg-surface-800 text-background hover:bg-on-background"
										: "bg-background text-surface-600 border") +
									" flex justify-center items-center h-10 relative rounded-md px-4 border-surface-200 transition-all duration-100 text-sm font-medium"
								}
							>
								Open
							</button>
						</div>
						<div
							style={{
								background:
									"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
								transition: "all .3s ease-in-out",
							}}
							class="absolute bg-on-background top-0 left-0 w-full h-full opacity-10 blur-3xl group-hover:opacity-50 group-focus-within:opacity-50"
						/>
						<div
							style={{
								background:
									"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
								transition: "all .3s ease-in-out",
							}}
							class="absolute bg-on-background top-0 left-0 w-full h-full opacity-5 blur-xl group-hover:opacity-15 group-focus-within:opacity-15"
						/>
						<div
							style={{
								background:
									"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
								transition: "all .3s ease-in-out",
							}}
							class="absolute bg-on-background top-0 left-0 w-full h-full opacity-10 blur-sm group-hover:opacity-25 group-focus-within:opacity-25"
						/>
					</form>

					<div class="pt-3">
						<Button type="text" href="/documentation">
							How to get started?
						</Button>
					</div>
				</div>
				{/* END search bar */}
				<CommunityProjects />
			</RootLayout>
		</>
	)
}
