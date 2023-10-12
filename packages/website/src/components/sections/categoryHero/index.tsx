import { showToast } from "#src/components/Toast.jsx"
import { Icon } from "#src/components/Icon.jsx"
import type { PageProps } from "#src/pages/@product/index.page.jsx"
import { CardTag } from "#src/pages/index/components/CardTag.jsx"
import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"
import Documents from "#src/pages/index/sections/01-hero/assets/categories/documents.jsx"
import Email from "#src/pages/index/sections/01-hero/assets/categories/email.jsx"
import Payments from "#src/pages/index/sections/01-hero/assets/categories/payments.jsx"
import Website from "#src/pages/index/sections/01-hero/assets/categories/website.jsx"
import { Match, Show, Switch, createSignal } from "solid-js"
import { rpc } from "@inlang/rpc"

const CategoryHero = (props: PageProps) => {
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
			<SectionLayout showLines={false} type="white">
				<div class="relative">
					<div class="grid xl:grid-cols-3 xl:gap-8 md:pt-20 pt-16 grid-flow-row-dense mb-12 min-h-[198px]">
						<div class="relative col-span-2 z-20 xl:mt-0 xl:pb-0">
							<h1 class="xl:col-span-2 text-[40px] md:text-5xl font-bold text-left  leading-none md:leading-tight mb-4">
								<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-[#F1D9FF] via-hover-primary to-[#3B82F6]">
									{props.content.title.split(" ")[0]}
								</span>{" "}
								{props.content.title.split(" ")[1]}
							</h1>
							<p class="text-lg text-surface-600">{props.content.description}</p>
						</div>
					</div>
					{/* <div class="w-full lg:w-1/2 text-surface-400">
						<Switch fallback={<></>}>
							<Match when={props.slug === "email"}>
								<EmailCard />
								<p class="ml-auto w-[370px] px-6 pt-8">{props.content.description}</p>
							</Match>
							<Match when={props.slug === "payments"}>
								<PaymentsCard />
								<p class="ml-auto w-[370px] px-6 pt-8">{props.content.description}</p>
							</Match>
							<Match when={props.slug === "website"}>
								<WebsiteCard />
								<p class="ml-auto w-[495px] px-6 pt-8">{props.content.description}</p>
							</Match>
							<Match when={props.slug === "documents"}>
								<DocumentsCard />
								<p class="ml-auto w-[370px] px-6 pt-8">{props.content.description}</p>
							</Match>
						</Switch>
					</div> */}
				</div>
			</SectionLayout>
		</>
	)
}

export default CategoryHero

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
