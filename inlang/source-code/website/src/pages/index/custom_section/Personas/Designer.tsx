import { Arrow } from "./Developer.jsx"
import Link from "#src/renderer/Link.jsx"
import * as m from "#src/paraglide/messages.js"

const DesignrSlide = () => {
	return (
		<div class="flex flex-col px-8 py-6 h-full">
			<div class="flex items-center justify-between">
				<h3 class="font-medium text-surface-600">{m.home_personas_designer_apps_title()}</h3>
				<Link class="flex items-center gap-2 text-surface-500 group" href="/c/apps">
					<p class="group-hover:text-surface-600">{m.home_personas_designer_more_apps()}</p>
					<div class="w-8 h-8 border border-surface-300 rounded-full flex justify-center items-center group-hover:bg-surface-100 transition-all text-surface-500 group-hover:text-surface-900">
						<Arrow />
					</div>
				</Link>
			</div>

			<Link
				href="/m/gkrpgoir"
				class="flex-1 bg-gradient-to-b from-surface-200 rounded-xl p-[1px] transition-all mt-4"
			>
				<div class="grid md:grid-cols-12 rounded-[11px] bg-gradient-to-b from-surface-50 to-background h-full">
					<div class="hidden col-span-5 pt-16 pl-8 pb-5 md:flex flex-col justify-between">
						<div>
							<h4 class="text-3xl font-bold tracking-tight w-full text-surface-900 max-w-[300px]">
								{m.home_personas_designer_main_title()}
							</h4>
							<p class="text-surface-500 max-w-[330px] mt-6">
								{m.home_personas_designer_main_description()}
							</p>
						</div>
						<div class="text-sm font-medium h-10 px-4 mt-8 bg-surface-200 hover:bg-surface-300 flex justify-center items-center w-fit rounded">
							{m.home_personas_designer_main_button()}
						</div>
					</div>
					<div class="col-span-12 md:col-span-7 relative">
						<div class="md:absolute w-full top-0 left-0 pointer-events-none">
							<img src="/images/parrot-cover-landingpage.png" alt="cover" />
						</div>
						<div class="flex flex-col justify-end md:col-span-1 md:h-full p-6 pb-3">
							<div class="flex items-center gap-4">
								<div class="w-10 h-10 rounded overflow-hidden">
									<img
										src="https://cdn.jsdelivr.net/gh/parrot-global/parrot@main/parrot-logo.svg"
										alt="logo"
									/>
								</div>
								<div class="flex-1">
									<h4 class="font-bold text-surface-600">
										{m.home_personas_designer_cards_parrot_title()}
									</h4>
									<p class="text-surface-500 text-sm">
										{m.home_personas_designer_cards_parrot_description()}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Link>
		</div>
	)
}

export default DesignrSlide
