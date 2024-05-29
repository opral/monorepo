import { Match, Show, Switch, createSignal } from "solid-js"
import { Chip } from "./Chip.jsx"
import { colorForTypeOf, typeOfIdToTitle } from "#src/interface/marketplace/helper/utilities.js"
import Plus from "~icons/material-symbols/add-rounded"
import { showToast } from "./Toast.jsx"
import { rpc } from "@inlang/rpc"
import { Button } from "#src/pages/index/components/Button.jsx"
import Link from "#src/renderer/Link.jsx"
import * as m from "#src/paraglide/messages.js"
import { currentPageContext } from "#src/renderer/state.js"

export default function Card(props: { item: any; displayName: string }) {
	const showCover =
		currentPageContext.urlParsed.pathname.includes("/lint-rules") &&
		// eslint-disable-next-line solid/reactivity
		props.item.id.split(".")[0] !== "guide"
			? true
			: false

	const app =
		// eslint-disable-next-line solid/reactivity
		props.item.id.split(".")[0] === "app" && currentPageContext.urlParsed.pathname.includes("/apps")

	const library =
		// eslint-disable-next-line solid/reactivity
		props.item.id.split(".")[0] === "library" &&
		currentPageContext.urlParsed.pathname.includes("/apps")

	const showOnApps = app || library

	return (
		<>
			<Link
				href={
					props.item.id.split(".")[0] === "guide"
						? `/g/${props.item.uniqueID}/${props.item.id.replaceAll(".", "-")}`
						: `/m/${props.item.uniqueID}/${props.item.id.replaceAll(".", "-")}`
				}
				class={
					"relative no-underline z-10 flex justify-between gap-4 overflow-hidden flex-col group w-full bg-background transition-all border border-surface-200 rounded-xl hover:shadow-lg hover:shadow-surface-100 hover:border-surface-300 active:border-surface-400 " +
					(showCover || showOnApps ? " " : /* min-h-48 */ " min-h-[12rem] p-5")
				}
			>
				<Switch>
					<Match when={showOnApps && props.item}>
						<img
							src={props.item.icon}
							alt={
								// @ts-ignore
								props.displayName.en
							}
							class="mx-4 mt-4 w-10 h-10 aspect-1 rounded object-cover object-center"
						/>
						<div class="flex flex-1 flex-col items-start px-4">
							<div class="flex items-center gap-2 mb-2">
								<h4 class="m-0 text-[15px] text-surface-800 line-clamp-2 leading-none no-underline font-bold group-hover:text-surface-900 transition-colors">
									{props.displayName}
								</h4>
								<Show
									when={props.item.keywords
										.map((keyword: string) => keyword.toLowerCase())
										.includes("external")}
								>
									<EcosystemIncompatibleBadge />
								</Show>
							</div>
							<p class="text-sm line-clamp-2 text-surface-500 transition-colors group-hover:text-surface-600 mb-2">
								{props.item.description.en}
							</p>
						</div>
						<div class="flex items-center gap-2 px-4 pr-6 mb-4 justify-between h-[30px]">
							<div>
								<Show
									when={
										// @ts-ignore (Show components are not typed)
										props.item.pricing
									}
								>
									<div class="h-[30px] px-4 rounded-full bg-surface-200 flex items-center text-surface-500 font-semibold text-[13px]">
										{
											// @ts-ignore
											props.item.pricing.toUpperCase()
										}
									</div>
								</Show>
							</div>
							<Show
								when={props.item.keywords
									.map((keyword: string) => keyword.toLowerCase())
									.includes("lix")}
							>
								<div>
									<div class="w-5 text-primary group transition-colors relative z-60">
										<sl-tooltip prop:content={m.marketplace_card_lix_tooltip()}>
											<LixBadge />
										</sl-tooltip>
									</div>
								</div>
							</Show>
						</div>
					</Match>
					<Match when={!showOnApps && showCover && props.item.gallery}>
						<img
							class="w-full h-36 object-cover object-center rounded-xl"
							alt={
								// @ts-ignore
								props.displayName.en
							}
							src={props.item.gallery && props.item.gallery[0]}
						/>
						<div class="flex flex-shrink-0 flex-row flex-wrap justify-between items-start mb-2 px-4">
							<p class="m-0 mb-2 text-sm text-surface-800 line-clamp-2 leading-none no-underline font-semibold group-hover:text-surface-900 transition-colors">
								{props.displayName}
							</p>
						</div>
					</Match>
					<Match when={(!showOnApps && !showCover) || (!showOnApps && props.item.gallery)}>
						<div class="flex flex-1 flex-col gap-4">
							<div class="w-full flex gap-4 items-start">
								<div class="flex items-center gap-8 flex-shrink-0">
									<Show
										when={props.item.icon}
										fallback={
											<div class="w-10 h-10 font-semibold text-xl line-clamp-2 rounded-md m-0 shadow-lg object-cover object-center flex items-center justify-center bg-gradient-to-t from-surface-800 to-surface-600 text-background">
												{props.displayName.split(" ")[0]![0]}
											</div>
										}
									>
										<img
											alt={
												// @ts-ignore
												props.displayName.en
											}
											class="w-10 h-10 rounded-lg m-0 object-cover object-center"
											src={props.item.icon}
										/>
									</Show>
								</div>
								<div class="flex flex-col justify-between items-start">
									<h4
										// eslint-disable-next-line solid/style-prop
										style="text-wrap: balance;"
										class="m-0 text-sm text-surface-800 line-clamp-2 leading-none no-underline font-semibold group-hover:text-surface-900 transition-colors"
									>
										{props.displayName}
									</h4>

									<div class="flex items-center mt-2 gap-1 flex-wrap">
										<Chip
											text={typeOfIdToTitle(props.item.id)}
											color={colorForTypeOf(props.item.id)}
											customClasses="text-xs"
										/>
										<Show
											when={
												props.item.keywords
													.map((keyword: string) => keyword.toLowerCase())
													.includes("external") &&
												!props.item.keywords
													.map((keyword: string) => keyword.toLowerCase())
													.includes("inlang")
											}
										>
											<EcosystemIncompatibleBadge />
										</Show>
									</div>
								</div>
							</div>
							<p class="text-sm line-clamp-2 text-surface-500 transition-colors group-hover:text-surface-600 mb-4">
								{props.item.description.en}
							</p>
						</div>
						<div class="flex items-center gap-2 justify-between">
							<Show when={props.item.publisherIcon}>
								<div class="flex gap-2">
									<img
										alt={
											// @ts-ignore
											props.item.publisherName.en
										}
										class="w-5 h-5 rounded-full object-cover object-center"
										src={props.item.publisherIcon}
									/>
									<p class="text-sm text-surface-500 group-hover:text-surface-600 transition-colors">
										{props.item.publisherName}
									</p>
								</div>
							</Show>
							<div>
								<Show
									when={props.item.keywords
										.map((keyword: string) => keyword.toLowerCase())
										.includes("lix")}
								>
									<div class="w-5 text-primary group transition-colors">
										<LixBadge />
									</div>
								</Show>
							</div>
						</div>
					</Match>
				</Switch>
			</Link>
		</>
	)
}

export function CardBuildOwn() {
	// eslint-disable-next-line solid/reactivity
	const app = () => currentPageContext.urlParsed.pathname.includes("/apps")

	return (
		<>
			<Link
				href="/documentation/publish-to-marketplace"
				class={
					"relative no-underline flex flex-col justify-center pt-8 items-center gap-4 group w-full bg-background transition-colors border border-surface-200 rounded-xl p-5 hover:shadow-lg hover:shadow-surface-100 hover:border-surface-300 active:border-surface-400 " +
					(app() ? "" : "h-48")
				}
			>
				<Plus class="w-10 h-10 text-surface-600 group-hover:text-surface-900 transition-colors" />
				<div class="flex flex-col justify-center items-center">
					<p class="m-0 mb-2 text-sm text-surface-600 leading-none no-underline text-center font-semibold group-hover:text-surface-900 transition-colors">
						{m.marketplace_grid_build_your_own_title()}
					</p>
					<p class="line-clamp-3 text-sm text-surface-500 transition-colors text-center group-hover:text-surface-600">
						{m.marketplace_grid_build_your_own_description()}
					</p>
				</div>
			</Link>
		</>
	)
}

const EcosystemIncompatibleBadge = () => {
	return (
		<div class="px-1.5 h-5 rounded bg-surface-200 flex items-center font-medium text-surface-500 text-[12px]">
			Ecosystem Incompatible
		</div>
	)
}

export function NoResultsCard(props: { category: string }) {
	const [email, setEmail] = createSignal("")
	const [loading, setLoading] = createSignal(false)

	const fetchSubscriber = async (category: string, email: string) => {
		setLoading(true)

		const response = await rpc.subscribeCategory({ category, email })
		if (!response.error) {
			if (response.data === "already subscribed") {
				showToast({
					title: "Could not subscribe",
					variant: "success",
					message: m.marketplace_grid_subscribe_could_not_subscribe(),
				})
			} else if (response.data === "success") {
				showToast({
					title: "Success",
					variant: "success",
					message: m.marketplace_grid_subscribe_success(),
				})
			} else {
				showToast({
					title: "Error",
					variant: "danger",
					message: m.marketplace_grid_subscribe_error(),
				})
			}
		} else {
			showToast({
				title: "Error",
				variant: "danger",
				message: m.marketplace_grid_subscribe_error(),
			})
		}

		setLoading(false)
		setEmail("")
	}

	function handleSubscribe() {
		if (loading()) return

		function checkEmail(email: any) {
			const re = /\S+@\S+\.\S+/

			if (email.trim() === "") {
				return "empty"
			} else if (!re.test(email)) {
				return "invalid"
			} else {
				return "valid"
			}
		}

		const emailValue = email()
		if (checkEmail(emailValue) === "empty") {
			showToast({
				title: "Error",
				variant: "danger",
				message: m.marketplace_grid_subscribe_no_email(),
			})
			return
		} else if (checkEmail(emailValue) === "invalid") {
			showToast({
				title: "Error",
				variant: "danger",
				message: m.marketplace_grid_subscribe_unvalid_email(),
			})
			return
		}

		fetchSubscriber(props.category.toLowerCase().replace("global ", ""), emailValue)
	}

	return (
		<div class="w-full h-[512px] rounded-3xl md:col-span-4 flex flex-col overflow-hidden justify-start items-stretch bg-gradient-to-t from-background to-surface-50 border border-surface-2">
			<div class="w-full md:pt-0 pt-16 overflow-hidden h-full">
				<div class="max-md:scale-[2]">
					<NoResultsArtwork />
				</div>
			</div>
			<div class="p-4 w-full h-full flex flex-col justify-center relative -translate-y-8 -mt-24">
				<h2 class="font-medium text-center text-xl mb-4">{m.marketplace_grid_subscribe_title()}</h2>
				<p class="text-center text-surface-500 mb-12">
					{m.marketplace_grid_subscribe_description_first_part()}{" "}
					<br class="min-[350px]:block hidden" />{" "}
					{m.marketplace_grid_subscribe_description_last_part()}
				</p>
				<div class="w-full flex justify-center flex-col items-center gap-4">
					<div
						class={
							"flex items-start justify-stretch gap-3 md:flex-row flex-col transition-opacity duration-150 " +
							(loading() ? "opacity-70 cursor-not-allowed" : "")
						}
					>
						<sl-input
							class={
								"border-none p-0 md:w-[312px] w-full " + (loading() ? "pointer-events-none" : "")
							}
							prop:size={"medium"}
							prop:placeholder={m.marketplace_grid_subscribe_placeholder()}
							// @ts-ignore
							value={email()}
							onInput={(event) => {
								// @ts-ignore
								setEmail(event.target.value)
							}}
							onPaste={(event) => {
								// @ts-ignore
								setEmail(event.target.value)
							}}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									handleSubscribe()
								}
							}}
						/>
						<button
							class={
								"h-10 text-sm text-background px-4 bg-surface-800 hover:bg-surface-900 max-md:w-full rounded-md font-medium transition-all duration-200 " +
								(loading() ? "pointer-events-none" : "")
							}
							onClick={handleSubscribe}
						>
							{m.marketplace_grid_subscribe_button()}
						</button>
					</div>
					<Button href="/documentation/publish-to-marketplace" chevron type="textPrimary">
						{m.marketplace_grid_subscribe_secondary_button()}
					</Button>
				</div>
			</div>
		</div>
	)
}

function NoResultsArtwork() {
	return (
		<svg
			width="100%"
			height="auto"
			viewBox="0 0 1252 300"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect x="805.234" y="127.341" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="805.234" y="203.747" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="805.234" y="50.9346" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="338.234" y="127.341" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="338.234" y="203.747" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="338.234" y="50.9346" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="454.984" y="127.341" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="454.984" y="203.747" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="454.984" y="50.9346" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="571.203" y="203.747" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="571.203" y="50.9346" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="687.43" y="127.341" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="687.43" y="203.747" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect x="687.43" y="50.9346" width="109.767" height="69.9493" rx="6.45686" fill="#E3E8EB" />
			<rect
				y="0.948242"
				width="1252"
				height="298.144"
				rx="20.491"
				fill="url(#paint0_radial_1529_5887)"
			/>
			<g filter="url(#filter0_d_1529_5887)">
				<rect x="571.203" y="127.34" width="109.767" height="69.9493" rx="6.45686" fill="white" />
			</g>
			<rect x="579.812" y="135.949" width="12.9137" height="12.9137" rx="4.30457" fill="#94A3B8" />
			<rect x="579.812" y="157.473" width="87.1676" height="12.9137" rx="4.30457" fill="#E2E8F0" />
			<rect x="579.812" y="174.689" width="63.4925" height="12.9137" rx="4.30457" fill="#E2E8F0" />
			<defs>
				<filter
					id="filter0_d_1529_5887"
					x="561.203"
					y="121.34"
					width="129.766"
					height="89.9492"
					filterUnits="userSpaceOnUse"
					color-interpolation-filters="sRGB"
				>
					<feFlood flood-opacity="0" result="BackgroundImageFix" />
					<feColorMatrix
						in="SourceAlpha"
						type="matrix"
						values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
						result="hardAlpha"
					/>
					<feOffset dy="4" />
					<feGaussianBlur stdDeviation="5" />
					<feComposite in2="hardAlpha" operator="out" />
					<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0" />
					<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1529_5887" />
					<feBlend
						mode="normal"
						in="SourceGraphic"
						in2="effect1_dropShadow_1529_5887"
						result="shape"
					/>
				</filter>
				<radialGradient
					id="paint0_radial_1529_5887"
					cx="0"
					cy="0"
					r="1"
					gradientUnits="userSpaceOnUse"
					gradientTransform="translate(626 150.02) rotate(90) scale(149.072 305.31)"
				>
					<stop stop-color="#F1F5F9" stop-opacity="0.56" />
					<stop offset="1" stop-color="#FAFCFD" />
				</radialGradient>
			</defs>
		</svg>
	)
}

export function LixBadge() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="100%" fill="none" viewBox="0 0 48 33">
			<path
				fill="currentColor"
				d="M26.854 10l4.005 7.628L40.964 0h6.208L34.85 20.91l6.491 10.908h-6.179l-4.304-7.542-4.233 7.542h-6.25l6.478-10.909L20.604 10h6.25zM10.898 31.818V10h6.052v21.818h-6.052zM6 .065v32H0v-32h6zM11 .065h16v5H11v-5z"
			/>
		</svg>
	)
}
