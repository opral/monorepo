import { handleNavigate, setSearchInput } from "#src/interface/components/SearchBar.jsx"
import Link from "#src/renderer/Link.jsx"
import { createSignal } from "solid-js"
import Calcom from "../old_sections/01-hero/assets/logos/clacom.jsx"
import AppFlowy from "../old_sections/01-hero/assets/logos/appflowy.jsx"
import Jitsi from "../old_sections/01-hero/assets/logos/jitsi.jsx"
import Listmonk from "../old_sections/01-hero/assets/logos/listmonk.jsx"
import OpenAssistant from "../old_sections/01-hero/assets/logos/openAssistant.jsx"
import * as m from "#src/paraglide/messages.js"

const HeroSearch = () => {
	const [input, setInput] = createSignal("")

	return (
		<div class="flex flex-col gap-2 items-center">
			<h1 class="text-4xl md:text-6xl text-surface-900 text-center font-semibold leading-snug tracking-tight mt-8 md:mt-20">
				{m.home_inlang_title()}
			</h1>
			<p class="text-lg max-w-[700px] text-center text-surface-500 pt-4">
				{m.home_inlang_description()}
			</p>
			<form
				class="relative w-full md:w-[600px] flex items-center group mt-8"
				onSubmit={(event) => {
					event.preventDefault()
					setSearchInput(input())
					handleNavigate()
				}}
			>
				<div
					class={
						"pl-3 pr-2 gap-2 relative z-10 flex items-center w-full border border-surface-200 bg-background rounded-lg transition-all focus-within:border-primary"
					}
				>
					<input
						class={
							"active:outline-0 focus:outline-0 focus:ring-0 border-0 h-14 grow placeholder:text-surface-500 placeholder:font-normal placeholder:text-base text-surface-800"
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
			<div class="pt-3">
				<Link href="https://www.sveltesummit.com/2023/fall" target="_blanc">
					<p class="hover:text-primary text-surface-500">{m.home_inlang_secondary_link()}</p>
				</Link>
			</div>
			<div class="w-full xl:w-3/4 flex flex-col gap-8 px-6 md:px-4 pb-14 md:pb-4 pt-14">
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
			</div>
		</div>
	)
}

export default HeroSearch
