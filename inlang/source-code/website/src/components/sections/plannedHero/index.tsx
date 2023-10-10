import { showToast } from "#src/components/Toast.jsx"
import type { PageProps } from "#src/pages/@product/index.page.jsx"
import { CardTag } from "#src/pages/index/components/CardTag.jsx"
import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"
import Documents from "#src/pages/index/sections/01-hero/assets/categories/documents.jsx"
import Email from "#src/pages/index/sections/01-hero/assets/categories/email.jsx"
import Payments from "#src/pages/index/sections/01-hero/assets/categories/payments.jsx"
import Website from "#src/pages/index/sections/01-hero/assets/categories/website.jsx"
import { Match, Switch, createSignal } from "solid-js"
import { rpc } from "@inlang/rpc"

const PlannedHero = (props: PageProps) => {
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
					message: "You are already getting notified.",
				})
			} else if (response.data === "success") {
				showToast({
					title: "Success",
					variant: "success",
					message: "You will be notified when this feature is available.",
				})
			} else {
				showToast({
					title: "Error",
					variant: "danger",
					message: "Something went wrong. Please try again later.",
				})
			}
		} else {
			showToast({
				title: "Error",
				variant: "danger",
				message: "Something went wrong. Please try again later.",
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
				message: "Please enter your email address",
			})
			return
		} else if (checkEmail(emailValue) === "invalid") {
			showToast({
				title: "Error",
				variant: "danger",
				message: "Please enter a valid email address",
			})
			return
		}

		fetchSubscriber(props.content.title.toLowerCase().replace("global ", ""), emailValue)
	}

	return (
		<>
			<SectionLayout showLines={true} type="dark">
				<div class="w-full flex px-6 md:px-10 pt-40 lg:pt-60 pb-24 md:pb-24 flex-col-reverse lg:flex-row">
					<div class="w-full lg:w-1/2 flex flex-col gap-8 pt-20 lg:pt-0">
						<h1 class="text-[40px] leading-tight md:text-6xl font-bold text-background pr-16 tracking-tight">
							inlang <br />
							<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-[#F1D9FF] via-hover-primary to-[#3B82F6]">
								{props.content.title}
							</span>
						</h1>
						<p class="text-surface-300 text-xl max-w-sm">{props.content.description}</p>
						<div
							class={
								"flex md:items-center items-start gap-4 md:flex-row flex-col " +
								(loading() ? "opacity-70 cursor-not-allowed" : "")
							}
						>
							<div
								class={"-ml-0.5 flex-shrink-0 relative " + (loading() ? "pointer-events-none" : "")}
							>
								<input
									type="email"
									placeholder="Your email"
									class="relative w-80 max-[350px]:w-full border-0 rounded-md bg-background z-10 placeholder:text-surface-400 font-medium px-4"
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
								<div
									style={{
										background:
											"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
									}}
									class="absolute z-0 bg-on-background top-0 left-0 w-full h-full opacity-60 blur-3xl"
								/>
								<div
									style={{
										background:
											"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
									}}
									class="absolute z-0 bg-on-background top-0 left-0 w-full h-full opacity-40 blur-xl"
								/>
								<div
									style={{
										background:
											"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
									}}
									class="absolute z-0 bg-on-background top-0 left-0 w-full h-full opacity-80 blur-sm"
								/>
							</div>
							<a
								href={"#"}
								class={"-ml-0.5 flex-shrink-0 " + (loading() ? "pointer-events-none" : "")}
								onClick={(e) => {
									e.preventDefault()
									handleSubscribe()
								}}
							>
								<button class="relative bg-surface-800">
									<div class="relative z-20 bg-surface-200 h-10 px-6 flex justify-center items-center shadow rounded-md hover:shadow-lg hover:bg-background transition-all">
										<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-surface-900 via-surface-800 to-surface-900 text-sm font-medium">
											Stay informed
										</span>
									</div>
									<div
										style={{
											background:
												"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
										}}
										class="absolute z-0 bg-on-background top-0 left-0 w-full h-full opacity-60 blur-3xl"
									/>
									<div
										style={{
											background:
												"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
										}}
										class="absolute z-0 bg-on-background top-0 left-0 w-full h-full opacity-40 blur-xl"
									/>
									<div
										style={{
											background:
												"linear-gradient(91.55deg, #51cbe0 2.95%, #5f98f3 52.23%, #bba0f8 99.17%)",
										}}
										class="absolute z-0 bg-on-background top-0 left-0 w-full h-full opacity-80 blur-sm"
									/>
								</button>
							</a>
						</div>
					</div>
					<div class="w-full lg:w-1/2">
						<Switch fallback={<></>}>
							<Match when={props.slug === "email"}>
								<EmailCard />
							</Match>
							<Match when={props.slug === "payments"}>
								<PaymentsCard />
							</Match>
							<Match when={props.slug === "website"}>
								<WebsiteCard />
							</Match>
							<Match when={props.slug === "documents"}>
								<DocumentsCard />
							</Match>
						</Switch>
					</div>
				</div>
			</SectionLayout>
		</>
	)
}

export default PlannedHero

function EmailCard() {
	return (
		<div class="max-w-sm h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0 ml-auto">
			<div class="absolute right-0 bottom-0 z-10">
				<Email />
			</div>
			<CardTag text="Email" globalPrefix noHover />
		</div>
	)
}

function PaymentsCard() {
	return (
		<div class="max-w-sm h-80 bg-surface-700 rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0 ml-auto">
			<div class="absolute left-1/2 -translate-x-1/2 bottom-0 z-10">
				<Payments />
			</div>
			<CardTag text="Payments" globalPrefix noHover />
		</div>
	)
}

function WebsiteCard() {
	return (
		<div class="max-w-sm md:max-w-[512px] h-80 bg-surface-800 rounded-3xl flex-shrink-0 relative group overflow-hidden border border-primary/0 ml-auto">
			<div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
				<Website />
			</div>
			<CardTag text="Website" globalPrefix noHover />
		</div>
	)
}

function DocumentsCard() {
	return (
		<div class="max-w-sm h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative group border border-primary/0 ml-auto">
			<div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 overflow-hidden">
				<Documents />
			</div>
			<CardTag text="Documents" globalPrefix noHover />
		</div>
	)
}
