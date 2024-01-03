import Link from "#src/renderer/Link.jsx"
import * as m from "#src/paraglide/messages.js"
import { Button } from "../components/Button.jsx"

const HeroSearch = () => {
	return (
		<div class="relative">
			<div class="relative z-30 flex flex-col w-1/2gap-2 pb-6 mt-8">
				<div class="pt-4 group">
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
				<h1 class="text-4xl max-w-[650px] md:text-5xl text-surface-900 font-bold leading-snug tracking-tight mt-6">
					{m.home_inlang_title()}
				</h1>
				<p class="text-lg max-w-[450px] text-surface-500 pt-5">{m.home_inlang_description()}</p>

				<div class="mt-8">
					<Link href="/g/7777asdy/guide-nilsjacobsen-ecosystemCompatible">
						<Button class="w-fit" type="secondary" chevron>
							{m.home_inlang_button()}
						</Button>
					</Link>
				</div>
			</div>
			<div class="hidden mb-4 lg:block relative lg:absolute z-10 lg:top-[50%] lg:-translate-y-[40%] lg:right-0 w-full lg:w-[600px] xl:w-[900px] flex-1 md:mt-0 mt-12 overflow-hidden">
				<div class="lg:block absolute inset-0 bg-gradient-to-r from-surface-50 from-20% via-surface-50/0 via-40% hidden" />
				<div class="lg:block absolute inset-0 bg-gradient-to-r from-surface-50/0 from-80% to-surface-50 hidden" />
				<img
					class="w-full lg:min-w-[900px] xl:min-w-[1000px] h-full object-contain object-right"
					src="/images/lix-transparent.webp"
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
