import { handleNavigate, setSearchInput } from "#src/interface/components/SearchBar.jsx"
import Link from "#src/renderer/Link.jsx"
import { For, createSignal } from "solid-js"
import * as m from "#src/paraglide/messages.js"

const HeroSearch = () => {
	const [input, setInput] = createSignal("")

	const getPopularButtons = () => {
		return [
			{
				name: "ParaglideJS",
				href: "/search?q=Paraglide JS",
			},
			{
				name: "Plugins",
				href: "/c/plugins",
			},
			{
				name: "Lint Rules",
				href: "/c/lint-rules",
			},
			{
				name: "Web Editor",
				href: "/search?q=Web%20Editor",
			},
		]
	}

	return (
		<div class="flex flex-col gap-2 items-center pb-8 md:pb-0">
			<h1 class="text-4xl max-w-[1000px] md:text-6xl text-surface-900 text-center font-bold leading-snug tracking-tight mt-8 md:mt-16 ">
				{m.home_inlang_title()}
			</h1>
			<p class="text-lg max-w-[700px] text-center text-surface-500 pt-4">
				{m.home_inlang_description()}
			</p>

			<form
				class="relative w-full md:w-[600px] flex items-center group mt-8 md:mt-12"
				onSubmit={(event) => {
					event.preventDefault()
					setSearchInput(input())
					handleNavigate()
				}}
			>
				<div
					class={
						"pl-6 pr-2 gap-2 relative z-10 flex items-center w-full border border-surface-200 bg-background rounded-lg transition-all focus-within:border-primary"
					}
				>
					<input
						class={
							"pl-0 active:outline-0 focus:outline-0 focus:ring-0 border-0 h-14 grow placeholder:text-surface-700 placeholder:font-normal placeholder:text-base text-surface-800"
						}
						placeholder={m.home_inlang_search_placeholder()}
						onInput={(event) => {
							// @ts-ignore
							setInput(event.target.value)
						}}
						onPaste={(event) => {
							// @ts-ignore
							setInput(event.target.value)
						}}
						//on:sl-change={() => (isValidUrl() ? navigateToEditor : undefined)}
					/>
					<button
						onClick={(event) => {
							event.preventDefault()
							setSearchInput(input())
							handleNavigate()
						}}
						class="bg-surface-800 text-background hover:bg-on-background flex justify-center items-center h-10 relative rounded-md px-4 border-surface-200 transition-all duration-100 text-sm font-medium"
					>
						{m.home_inlang_search_button()}
					</button>
				</div>
				<div
					style={{
						background: "linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
						transition: "all .3s ease-in-out",
					}}
					class="absolute bg-on-background top-0 left-0 w-full h-full opacity-10 blur-3xl group-hover:opacity-50 group-focus-within:opacity-50"
				/>
				<div
					style={{
						background: "linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
						transition: "all .3s ease-in-out",
					}}
					class="absolute bg-on-background top-0 left-0 w-full h-full opacity-5 blur-xl group-hover:opacity-15 group-focus-within:opacity-15"
				/>
				<div
					style={{
						background: "linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
						transition: "all .3s ease-in-out",
					}}
					class="absolute bg-on-background top-0 left-0 w-full h-full opacity-10 blur-sm group-hover:opacity-25 group-focus-within:opacity-25"
				/>
			</form>
			<div class="pt-4 group">
				<Link href="https://www.youtube.com/live/pTgIx-ucMsY?feature=shared&t=3825" target="_blanc">
					<div class="flex gap-4 items-center text-surface-500 group-hover:text-active-primary">
						<Play />
						<p>{m.home_inlang_secondary_link()}</p>
					</div>
				</Link>
			</div>
			{/* <div class="w-full xl:w-3/4 flex flex-col gap-8 px-6 md:px-4 pb-14 md:pb-4 pt-8 md:pt-20">
				<div class="flex gap-4 justify-center md:gap-12 items-center w-full xl:justify-center text-surface-400 flex-wrap">
					<Link class="transition-opacity hover:opacity-80" href="https://cal.com/" target="_blank">
						<Calcom />
					</Link>
					<Link
						class="transition-opacity hover:opacity-80"
						href="https://appflowy.io/"
						target="_blank"
					>
						<AppFlowy />
					</Link>
					<Link
						class="transition-opacity hover:opacity-80"
						href="https://meet.jit.si/"
						target="_blank"
					>
						<Jitsi />
					</Link>
					<Link
						class="transition-opacity hover:opacity-80"
						href="https://listmonk.app/"
						target="_blank"
					>
						<Listmonk />
					</Link>
					<Link
						class="transition-opacity hover:opacity-80"
						href="https://open-assistant.io/"
						target="_blank"
					>
						<OpenAssistant />
					</Link>
				</div>
			</div> */}
		</div>
	)
}

export default HeroSearch

function Play() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" fill="none" viewBox="0 0 20 18">
			<path
				fill="currentColor"
				d="M0 3.25A3.25 3.25 0 013.25 0h13.5A3.25 3.25 0 0120 3.25v11.5A3.25 3.25 0 0116.75 18H3.25A3.25 3.25 0 010 14.75V3.25zM3.25 1.5A1.75 1.75 0 001.5 3.25v11.5c0 .966.784 1.75 1.75 1.75h13.5a1.75 1.75 0 001.75-1.75V3.25a1.75 1.75 0 00-1.75-1.75H3.25zM7 6.25v5.5a1 1 0 001.482.876l5-2.75a1 1 0 000-1.752l-5-2.75A1 1 0 007 6.251V6.25z"
			/>
		</svg>
	)
}
