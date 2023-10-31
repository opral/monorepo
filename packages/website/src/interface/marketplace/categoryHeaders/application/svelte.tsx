import { IconSvelte } from "#src/interface/custom-icons/subcategoryIcon.jsx"
import { Button } from "#src/pages/index/components/Button.jsx"
import * as m from "@inlang/paraglide-js/inlang-marketplace/messages"

const SvelteHeader = () => {
	return (
		<>
			<div class="relative bg-gradient-to-r from-background to-slate-200 overflow-hidden rounded-xl border border-surface-200 flex flex-col md:flex-row items-center">
				<div class="relative z-30 flex-1 flex flex-col items-start gap-4 px-5 md:pl-8">
					<div class="pb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="38"
							fill="none"
							viewBox="0 0 28 38"
						>
							<path fill="#334155" d="M0 0h28v38L14 26.057 0 38V0z" />
						</svg>
					</div>
					<div class="flex md:items-center flex-col md:flex-row gap-2">
						<IconSvelte class="w-7 h-7" />
						<h2 class="font-medium text-md">{m.marketplace_application_header_svelte_title()}</h2>
					</div>
					<p class="md:w-1/2 text-sm text-surface-500">
						{m.marketplace_application_header_svelte_description()}
					</p>
					<div class="py-6">
						<Button type="secondary" href="/g/2fg8ng94/guide-nilsjacobsen-buildAGlobalSvelteApp">
							{m.marketplace_application_header_svelte_button()}
						</Button>
					</div>
				</div>
				<div class="relative z-20 flex-1 px-4 md:pr-16 pb-8">
					<img
						class="w-full h-full"
						src="/images/svelte-header-image.png"
						alt="svelte header image"
					/>
				</div>
				<div class="z-10 top-[-50%] left-0 absolute w-full h-full">
					<Background />
				</div>
			</div>
		</>
	)
}

export default SvelteHeader

function Background() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1276 764">
			<g clip-path="url(#clip0_1758_16377)" opacity="0.08">
				<g clip-path="url(#clip1_1758_16377)">
					<path
						fill="#FF3E00"
						d="M1363.47 111.884a229.656 229.656 0 00-301.83-62.807L889.725 155.393a190.955 190.955 0 00-89.091 128.2 196.707 196.707 0 0020.475 129.453 188.307 188.307 0 00-29.459 71.662 199.362 199.362 0 0035.831 154.279 229.753 229.753 0 00301.849 62.91l171.94-106.291a191.045 191.045 0 0058.23-54.589 190.988 190.988 0 0030.86-73.61c8.23-44.256 1-89.993-20.47-129.556a187.884 187.884 0 0029.48-71.662 199.26 199.26 0 00-1.95-80.875 199.45 199.45 0 00-33.95-73.43z"
					/>
					<path
						fill="#fff"
						d="M1044.87 647.817a138.532 138.532 0 01-146.443-52.698 119.738 119.738 0 01-21.704-92.777 110.15 110.15 0 014.07-15.612l3.25-9.598 8.804 6.091a224.216 224.216 0 0067.261 32.607l6.27 1.868-.64 6.066a36.88 36.88 0 006.936 24.775 41.72 41.72 0 0044.606 16.277 38.607 38.607 0 0010.52-4.479l171.48-106.316a34.918 34.918 0 0016.2-23.265c.92-4.834.85-9.805-.23-14.608a35.984 35.984 0 00-6.01-13.314 41.842 41.842 0 00-44.18-15.92 38.614 38.614 0 00-10.57 4.505l-65.82 40.54a126.278 126.278 0 01-34.91 14.896 138.612 138.612 0 01-81.401-3.821 138.586 138.586 0 01-65.179-48.902 119.74 119.74 0 01-21.269-92.854 115.356 115.356 0 0153.466-77.038l171.683-106.316a126.21 126.21 0 0134.91-14.87 138.54 138.54 0 01146.6 52.697 119.937 119.937 0 0120.48 44.138 119.696 119.696 0 011.22 48.64 109.214 109.214 0 01-4.07 15.612l-3.25 9.598-8.8-6.066a223.115 223.115 0 00-67.26-32.607l-6.27-1.893.64-6.066a36.818 36.818 0 00-6.96-24.775 41.708 41.708 0 00-19.62-14.762 41.708 41.708 0 00-24.53-1.157c-3.72.961-7.26 2.48-10.52 4.504L991.588 296.875a34.621 34.621 0 00-16.15 23.24 35.686 35.686 0 006.245 27.948 41.825 41.825 0 0044.177 15.894 39.503 39.503 0 0010.57-4.479l65.57-40.566a125.368 125.368 0 0134.91-14.87 138.628 138.628 0 0181.4 3.811 138.614 138.614 0 0165.2 48.886 119.771 119.771 0 0120.4 44.152 119.799 119.799 0 011.18 48.625 115.2 115.2 0 01-18.53 44.249 115.103 115.103 0 01-34.94 32.866l-171.66 106.316a125.242 125.242 0 01-34.91 14.87"
					/>
				</g>
			</g>
			<defs>
				<clipPath id="clip0_1758_16377">
					<rect width="1276" height="764" fill="#fff" rx="16" />
				</clipPath>
				<clipPath id="clip1_1758_16377">
					<path fill="#fff" d="M0 0H590V785H0z" transform="translate(686)" />
				</clipPath>
			</defs>
		</svg>
	)
}
