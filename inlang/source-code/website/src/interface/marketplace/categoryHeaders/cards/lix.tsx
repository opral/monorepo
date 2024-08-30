import { Button } from "#src/pages/index/components/Button.jsx"
import * as m from "#src/paraglide/messages.js"

const LixHeader = () => {
	return (
		<>
			<div class="relative bg-surface-100 md:items-center overflow-hidden rounded-xl border border-surface-200 flex flex-col md:flex-row mb-8">
				<div class="relative z-30 flex-1 flex flex-col items-start gap-4 px-8 md:py-8 max-w-sm">
					<div class="p-2.5 text-primary rounded-lg overflow-hidden bg-background mt-8 md:mt-0 h-12 w-12 flex items-center justify-center">
						<LixLogo />
					</div>
					<div class="flex md:items-center flex-col md:flex-row gap-2 pt-2">
						<h2 class="font-medium text-md">{m.marketplace_header_lix_title_explanation()}</h2>
					</div>
					<p class="max-w-[400px] text-sm text-surface-500 leading-relaxed">
						{m.marketplace_header_lix_description()}
					</p>
					<div class="pt-2 flex flex-wrap gap-4">
						<Button type="secondaryOnGray" href="https://lix.opral.com">
							{m.marketplace_header_lix_button()}
						</Button>
					</div>
				</div>
				<div class="relative z-20 flex-1 w-full md:h-56 h-96 md:mt-0 mt-12 overflow-hidden">
					<div class="absolute inset-0 bg-gradient-to-r from-surface-100 via-surface-100/0 to-surface-100 md:block hidden" />
					<img
						class="w-full h-full object-cover object-left"
						src="/images/lix-transparent.webp"
						alt="lix header image"
					/>
				</div>
			</div>
		</>
	)
}

export default LixHeader

function LixLogo() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="100%" fill="none" viewBox="0 0 48 33">
			<path
				fill="currentColor"
				d="M26.854 10l4.005 7.628L40.964 0h6.208L34.85 20.91l6.491 10.908h-6.179l-4.304-7.542-4.233 7.542h-6.25l6.478-10.909L20.604 10h6.25zM10.898 31.818V10h6.052v21.818h-6.052zM6 .065v32H0v-32h6zM11 .065h16v5H11v-5z"
			/>
		</svg>
	)
}
