import Link from "#src/renderer/Link.jsx"
import * as m from "#src/paraglide/messages.js"
import { Button } from "../components/Button.jsx"

const isProduction = process.env.NODE_ENV === "production"

const HeroSearch = () => {
	return (
		<div class="relative grid grid-cols-12">
			<div class="col-span-12 lg:col-span-7 items-center lg:items-start relative z-30 flex flex-col gap-2 pb-6 mt-4 md:mt-8">
				<div class="pt-8 group">
					<Link
						href="https://www.youtube.com/live/pTgIx-ucMsY?feature=shared&t=3825"
						target="_blanc"
					>
						<Button class="w-fit" type="text">
							<Play />
							<p>{m.home_inlang_secondary_link()}</p>
						</Button>
					</Link>
				</div>
				<h1 class="text-4xl md:text-6xl text-surface-900 text-center lg:text-start font-bold tracking-tight mt-6">
					{m.home_inlang_title()}
				</h1>
				<p class="text-center lg:text-start text-xl max-w-[600px] text-surface-500 pt-5">
					{addLinksToText(m.home_inlang_description())}
				</p>

				<div class="mt-8">
					<Button class="w-fit" type="secondary" href="/documentation">
						{m.home_inlang_button()}
					</Button>
				</div>
			</div>
			<div class="col-span-12 lg:col-span-5 mb-10 lg:mb-0 mt-6 lg:mt-16 overflow-hidden flex items-center justify-center w-full">
				<img
					class="w-full max-w-[500px]"
					src="/images/hero-cover-updated.png"
					alt="lix header image"
				/>
			</div>
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

function addLinksToText(text: string) {
	const replacements: { [key: string]: string } = {
		"use case": `${isProduction ? `https://inlang.com?` : "http://localhost:3000?"}#personas`,
		"change control": `${isProduction ? `https://inlang.com?` : "http://localhost:3000?"}#lix`,
	}

	const elements = []
	let lastIndex = 0

	for (const phrase in replacements) {
		if (Object.prototype.hasOwnProperty.call(replacements, phrase)) {
			const url = replacements[phrase]
			const regex = new RegExp(`\\b${phrase}\\b`, "g")
			const matches = [...text.matchAll(regex)]

			for (const match of matches) {
				const index: number = match.index || 0
				elements.push(text.slice(lastIndex, index))
				elements.push(
					<a
						href={url}
						class="font-semibold text-surface-900 hover:opacity-70 underline underline-offset-2"
						onClick={(e) => {
							e.preventDefault()
							scrollToAnchor(url!.split("#")[1]!, "smooth")
						}}
					>
						{phrase}
					</a>
				)
				lastIndex = index + match[0].length
			}
		}
	}

	elements.push(text.slice(Math.max(0, lastIndex)))

	return elements
}

const scrollToAnchor = (anchor: string, behavior?: ScrollBehavior) => {
	const element = document.getElementById(anchor)
	if (element && window) {
		window.scrollTo({
			top: element.offsetTop - 96,
			behavior: behavior ?? "instant",
		})
	}
	//window.history.pushState({}, "", `${currentPageContext.urlParsed.pathname}#${anchor}`)
}
