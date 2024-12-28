import { Button } from "#src/pages/index/components/Button.jsx";
import * as m from "#src/paraglide/messages.js";

const ParaglideHeader = () => {
	return (
		<>
			<div class="relative bg-surface-100 md:items-end overflow-hidden rounded-xl border border-surface-200 flex flex-col md:flex-row mb-4">
				<div class="relative z-30 flex-1 flex flex-col items-start gap-4 px-8 md:py-8">
					<div class="p-1 rounded-lg overflow-hidden mt-8 md:mt-0">
						<img
							class="w-10 h-10 object-cover"
							src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/packages/paraglide/paraglide-js/assets/paraglideNoBg.png"
							alt="paraglide logo"
						/>
					</div>

					<div class="flex md:items-center flex-col md:flex-row gap-2 pt-2">
						<h2 class="font-bold text-surface-900 tracking-tight text-xl">
							{m.marketplace_header_paraglide_title()}
						</h2>
					</div>
					<p class="max-w-[400px] text-surface-500 text-md font-regular leading-relaxed">
						{m.marketplace_header_paraglide_description()}
					</p>
					<div class="pt-2 flex flex-wrap gap-4">
						<Button
							type="secondaryOnGray"
							href="/m/gerre34r/library-inlang-paraglideJs"
						>
							{m.marketplace_header_paraglide_button_text()}
						</Button>
						<Button
							type="text"
							href="https://www.youtube.com/live/pTgIx-ucMsY?feature=shared&t=3822"
							chevron
						>
							{m.marketplace_header_paraglide_button_secondary_text()}
						</Button>
					</div>
				</div>
				<div class="relative z-20 flex-1 px-4 max-w-[550px] mx-auto md:pr-20 pt-8 md:pt-12">
					<img
						class="w-full h-full"
						src="/images/paraglidePage.png"
						alt="svelte header image"
					/>
				</div>
			</div>
		</>
	);
};

export default ParaglideHeader;
