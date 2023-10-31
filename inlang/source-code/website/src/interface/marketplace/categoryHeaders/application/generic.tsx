import { Button } from "#src/pages/index/components/Button.jsx"
import * as m from "@inlang/paraglide-js/website/messages"

const GenericHeader = () => {
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
						<p class="text-sm px-2 py-1 rounded bg-surface-100 text-surface-500 font-medium w-fit">
							{m.marketplace_application_header_generic_tag()}
						</p>
						<h2 class="font-medium text-md">{m.marketplace_application_header_generic_title()}</h2>
					</div>
					<p class="md:w-1/2 text-sm text-surface-500">
						{m.marketplace_application_header_generic_description()}
					</p>
					<div class="py-6">
						<Button type="secondary" href="/g/49fn9ggo/guide-niklasbuchfink-howToSetupInlang">
							{m.marketplace_application_header_generic_button()}
						</Button>
					</div>
				</div>
				<div class="relative z-20 md:w-1/2 px-4 md:pr-20 lg:pr-40">
					<img
						class="w-full h-full"
						src="/images/inlang-header-image.png"
						alt="svelte header image"
					/>
				</div>
				<div class="z-10 top-[-20%] lg:top-[-120%] left-0 absolute w-full h-full">
					<Background />
				</div>
			</div>
		</>
	)
}

export default GenericHeader

function Background() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1276 1006">
			<g clip-path="url(#clip0_1761_16739)" filter="url(#filter0_d_1761_16739)" opacity="0.1">
				<path
					fill="#94A3B8"
					d="M737.337 680.324V413.882h73.896v266.442h-73.896zm37.121-300.788c-10.986 0-20.411-3.643-28.275-10.928-7.748-7.402-11.622-16.248-11.622-26.541 0-10.176 3.874-18.907 11.622-26.193 7.864-7.401 17.289-11.102 28.275-11.102 10.986 0 20.353 3.701 28.102 11.102 7.863 7.286 11.795 16.017 11.795 26.193 0 10.293-3.932 19.139-11.795 26.541-7.749 7.285-17.116 10.928-28.102 10.928zm164.981 146.751v154.037h-73.896V413.882h70.427v47.009h3.122c5.898-15.496 15.785-27.754 29.663-36.775 13.877-9.135 30.703-13.703 50.475-13.703 18.51 0 34.64 4.047 48.4 12.142 13.76 8.095 24.46 19.66 32.09 34.693 7.63 14.918 11.45 32.727 11.45 53.427v169.649h-73.9V523.859c.12-16.306-4.04-29.027-12.49-38.163-8.44-9.251-20.06-13.877-34.863-13.877-9.945 0-18.734 2.14-26.366 6.418-7.517 4.279-13.415 10.524-17.694 18.735-4.163 8.095-6.302 17.867-6.418 29.315zm298.981-201.219v355.256h-73.89V325.068h73.89z"
				/>
			</g>
			<defs>
				<filter
					id="filter0_d_1761_16739"
					width="1684.1"
					height="1715.05"
					x="146.299"
					y="-268.276"
					color-interpolation-filters="sRGB"
					filterUnits="userSpaceOnUse"
				>
					<feFlood flood-opacity="0" result="BackgroundImageFix" />
					<feColorMatrix
						in="SourceAlpha"
						result="hardAlpha"
						values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
					/>
					<feOffset dy="86.425" />
					<feGaussianBlur stdDeviation="172.851" />
					<feComposite in2="hardAlpha" operator="out" />
					<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
					<feBlend in2="BackgroundImageFix" result="effect1_dropShadow_1761_16739" />
					<feBlend in="SourceGraphic" in2="effect1_dropShadow_1761_16739" result="shape" />
				</filter>
				<clipPath id="clip0_1761_16739">
					<rect width="1276" height="1006" fill="#fff" rx="16" />
				</clipPath>
			</defs>
		</svg>
	)
}
