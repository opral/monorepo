import { Show, createSignal } from "solid-js"
import { Chip } from "./Chip.jsx"
import { colorForTypeOf, typeOfIdToTitle } from "#src/interface/helper/utilities.js"
import Plus from "~icons/material-symbols/add-rounded"
import { showToast } from "./Toast.jsx"
import { rpc } from "@inlang/rpc"
import { Button } from "#src/interface/components/Button.jsx"
import Link from "#src/renderer/Link.jsx"
import * as m from "#src/paraglide/messages.js"

export default function Card(props: { item: any; displayName: string }) {
	return (
		<>
			<Link
				href={
					props.item.id.split(".")[0] === "guide"
						? `/g/${props.item.uniqueID}/${props.item.id.replaceAll(".", "-")}`
						: `/m/${props.item.uniqueID}/${props.item.id.replaceAll(".", "-")}`
				}
				class={
					"relative no-underline flex gap-4 flex-col justify-between group w-full bg-background hover:bg-surface-50 transition-colors border border-surface-200 rounded-xl p-5 h-48"
				}
			>
				{/* <Show when={props.highlight && props.item.gallery}>
					<img class="h-64 object-cover object-top rounded-lg" src={props.item.gallery[0]} />
				</Show> */}
				<div class="flex flex-col gap-4">
					<div class="w-full flex gap-4 items-start">
						<div class="flex items-center gap-8 flex-shrink-0">
							<Show
								when={props.item.icon}
								fallback={
									<div class="w-10 h-10 font-semibold text-xl rounded-md m-0 shadow-lg object-cover object-center flex items-center justify-center bg-gradient-to-t from-surface-800 to-surface-600 text-background">
										{props.displayName.split(" ")[0]![0]}
									</div>
								}
							>
								<img
									class="w-10 h-10 rounded-lg m-0 object-cover object-center"
									src={props.item.icon}
								/>
							</Show>
						</div>
						<div class="flex flex-col justify-between items-start">
							<p class="m-0 mb-2 text-sm text-surface-800 leading-none no-underline font-semibold group-hover:text-surface-900 transition-colors">
								{props.displayName}
							</p>
							<Chip
								text={typeOfIdToTitle(props.item.id)}
								color={colorForTypeOf(props.item.id)}
								customClasses="text-xs"
							/>
						</div>
						<Show
							when={
								props.item.id.split(".")[0] === "plugin" ||
								props.item.id.split(".")[0] === "messageLintRule"
							}
						>
							<sl-tooltip prop:content={`Install`}>
								<a
									onClick={(e) => {
										e.stopPropagation()
									}}
									href={`/install?module=${props.item.id}`}
									class="ml-auto flex-shrink-0 rounded-full p-2 w-8 h-8 flex items-center justify-center text-background hover:text-background hover:bg-surface-700 bg-surface-900 transition-all"
								>
									<svg
										width="100%"
										height="100%"
										viewBox="0 0 16 16"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											fill-rule="evenodd"
											clip-rule="evenodd"
											d="M11.6 5.54982L11.6 5.5498L8.99999 8.14981L11.6 5.54982ZM8.69999 8.87407L11.5962 5.97782L12.5794 6.99612L7.99999 11.5755L3.42056 6.99612L4.40374 5.97782L7.29999 8.87407V0.299805H8.69999V8.87407ZM14.3 14.2998V11.2998H15.7V13.9998C15.7 14.4696 15.5362 14.8643 15.2004 15.2002C14.8645 15.536 14.4698 15.6998 14 15.6998H1.99999C1.53019 15.6998 1.13547 15.536 0.79962 15.2002C0.463765 14.8643 0.299988 14.4696 0.299988 13.9998V11.2998H1.69999V14.2998H14.3Z"
											fill="currentColor"
										/>
									</svg>
								</a>
							</sl-tooltip>
						</Show>
					</div>

					<p class="text-sm line-clamp-2 text-surface-500 transition-colors group-hover:text-surface-600">
						{props.item.description.en}
					</p>
				</div>
				<Show
					when={
						props.item.id.split(".")[0] === "plugin" ||
						props.item.id.split(".")[0] === "messageLintRule"
					}
				>
					{/* <sl-tooltip prop:content="Install"> */}
					<Link
						onClick={(e: any) => {
							e.stopPropagation()
						}}
						href={"/install?module=" + structuredClone(props.item.id)}
						class="absolute top-5 right-5 flex-shrink-0 rounded-full p-2 w-8 h-8 flex items-center justify-center text-background hover:text-background hover:bg-surface-700 bg-surface-900 transition-all"
					>
						<svg
							width="100%"
							height="100%"
							viewBox="0 0 16 16"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								fill-rule="evenodd"
								clip-rule="evenodd"
								d="M11.6 5.54982L11.6 5.5498L8.99999 8.14981L11.6 5.54982ZM8.69999 8.87407L11.5962 5.97782L12.5794 6.99612L7.99999 11.5755L3.42056 6.99612L4.40374 5.97782L7.29999 8.87407V0.299805H8.69999V8.87407ZM14.3 14.2998V11.2998H15.7V13.9998C15.7 14.4696 15.5362 14.8643 15.2004 15.2002C14.8645 15.536 14.4698 15.6998 14 15.6998H1.99999C1.53019 15.6998 1.13547 15.536 0.79962 15.2002C0.463765 14.8643 0.299988 14.4696 0.299988 13.9998V11.2998H1.69999V14.2998H14.3Z"
								fill="currentColor"
							/>
						</svg>
					</Link>
					{/* </sl-tooltip> */}
				</Show>
			</Link>
		</>
	)
}

export function CardBuildOwn() {
	return (
		<>
			<Link
				href="/documentation/publish-marketplace"
				class="relative no-underline h-48 flex flex-col justify-center pt-8 items-center gap-4 group w-full bg-background hover:bg-surface-50 transition-colors border border-surface-200 rounded-xl p-5"
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
								"h-10 text-sm text-background px-4 bg-surface-700 hover:bg-surface-800 max-md:w-full rounded-md font-medium transition-all duration-200 " +
								(loading() ? "pointer-events-none" : "")
							}
							onClick={handleSubscribe}
						>
							{m.marketplace_grid_subscribe_button()}
						</button>
					</div>
					<Button href="/documentation/publish-marketplace" chevron type="textPrimary">
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
