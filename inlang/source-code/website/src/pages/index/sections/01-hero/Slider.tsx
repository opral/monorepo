import App from "./assets/categories/app.jsx"
import Email from "./assets/categories/email.jsx"
import Payments from "./assets/categories/payments.jsx"
import Website from "./assets/categories/website.jsx"
import Documents from "./assets/categories/documents.jsx"
import { CardTag } from "../../components/CardTag.jsx"
import "solid-slider/slider.css"
import CardGradient from "../../components/CardGradient.jsx"
import { createScrollPosition } from "@solid-primitives/scroll"

export default function CategorieSlider() {
	let slider: HTMLDivElement | undefined
	const windowScroll = createScrollPosition()

	return (
		<div
			style={{
				transform:
					windowScroll.y < 1440
						? `translate(-${windowScroll.y / 2}px, 0px)`
						: "translate(0px, 0px)",
			}}
			ref={slider}
			class="w-full h-64 pl-4 transition duration-100 ease-linear"
		>
			<div class="flex h-full w-max gap-4">
				<div class="w-[416px] h-64">
					<div class="flex justify-center items-center">
						<div class="w-full h-64 bg-surface-800 rounded-2xl flex-shrink-0 relative">
							<div class="z-10 absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 overflow-hidden opacity-80">
								<App />
							</div>
							<CardTag text="App" globalPrefix />
							<CardGradient />
						</div>
					</div>
				</div>
				<div class="w-[255px] h-64">
					<div class="flex justify-center items-center md:px-0 px-3">
						<div class="max-w-sm w-full h-64 bg-surface-600 rounded-2xl flex-shrink-0 relative">
							<div class="z-10 absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 overflow-hidden opacity-80">
								<Payments />
							</div>
							<CardTag text="Payment" globalPrefix />
							<CardGradient />
						</div>
					</div>
				</div>
				<div class="w-[269px] h-64">
					<div class="flex justify-center items-center">
						<div class="w-full h-64 bg-[#043855] rounded-2xl flex-shrink-0 relative overflow-hidden">
							<div class="z-10 absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 overflow-hidden opacity-80">
								<Email />
							</div>
							<CardTag text="Email" globalPrefix />
							<CardGradient />
						</div>
					</div>
				</div>
				<div class="w-[384px] h-64">
					<div class="flex justify-center items-center md:px-0 px-3">
						<div class="max-w-sm w-full h-64 bg-surface-800 rounded-2xl flex-shrink-0 relative">
							<div class="z-10 absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 overflow-hidden opacity-80">
								<Website />
							</div>
							<CardTag text="Website" globalPrefix />
							<CardGradient />
						</div>
					</div>
				</div>

				<div class="w-64 h-64">
					<div class="flex justify-center items-center md:px-0 px-3">
						<div class="max-w-sm w-full h-64 bg-[#043855] rounded-2xl flex-shrink-0 relative">
							<div class="z-10 absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 overflow-hidden opacity-80">
								<Documents />
							</div>
							<CardTag text="Documents" globalPrefix />
							<CardGradient />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

{
	/* // <div class="h-64 w-full bg-surface-300 flex gap-4 inline-flex justify-start">
		// 	<div class="h-64 w-64 bg-surface-100" />
		// 	<div class="h-64 w-64 bg-surface-100" />
		// 	<div class="h-64 w-64 bg-surface-100" />
		// 	<div class="h-64 w-64 bg-surface-100" />
		// 	<div class="h-64 w-64 bg-surface-100" />
		// 	<div class="h-64 w-64 bg-surface-100" />
		// 	<div class="xl:pl-64 flex">
		// 		<div class="flex justify-center items-center md:px-0 px-3">
		// 			<a
		// 				href="/documents"
		// 				class="active:cursor-grabbing max-w-sm w-full h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative group border border-primary/0 hover:border-background/20 transition-all"
		// 			>
		// 				<div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 overflow-hidden">
		// 					<Documents />
		// 				</div>
		// 				<div class="absolute inset-0 blur-3xl transition-all opacity-0 group-hover:opacity-25">
		// 					<Documents />
		// 				</div>
		// 				<CardTag text="Documents" globalPrefix />
		// 			</a>
		// 		</div>
		// 		<div class="flex justify-center items-center md:px-0 px-3">
		// 			<a
		// 				href="/app"
		// 				class="active:cursor-grabbing lg:w-[512px] max-w-lg w-full h-80 bg-surface-800 rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0 hover:border-background/20 transition-all"
		// 			>
		// 				<div class="absolute -right-4 bottom-0 z-10">
		// 					<App />
		// 				</div>
		// 				<div class="absolute inset-0 transition-all blur-md opacity-0 group-hover:opacity-100">
		// 					<App />
		// 				</div>
		// 				<CardTag text="App" globalPrefix />
		// 			</a>
		// 		</div>
		// 		<div class="flex justify-center items-center md:px-0 px-3">
		// 			<a
		// 				href="/email"
		// 				class="active:cursor-grabbing max-w-sm w-full h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0 hover:border-background/20 transition-all"
		// 			>
		// 				<div class="absolute right-0 bottom-0 z-10">
		// 					<Email />
		// 				</div>
		// 				<div class="absolute inset-0 transition-all blur-2xl opacity-0 group-hover:opacity-25">
		// 					<Email />
		// 				</div>
		// 				<CardTag text="Email" globalPrefix />
		// 			</a>
		// 		</div>
		// 		<div class="flex justify-center items-center md:px-0 px-3">
		// 			<a
		// 				href="/payments"
		// 				class="active:cursor-grabbing max-w-sm w-full h-80 bg-surface-700 rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0 hover:border-background/20 transition-all"
		// 			>
		// 				<div class="absolute left-1/2 -translate-x-1/2 bottom-0 z-10">
		// 					<Payments />
		// 				</div>
		// 				<div class="absolute inset-0 transition-all blur-2xl opacity-0 group-hover:opacity-25">
		// 					<Payments />
		// 				</div>
		// 				<CardTag text="Payments" globalPrefix />
		// 			</a>
		// 		</div>
		// 		<div class="flex justify-center items-center md:px-0 px-3">
		// 			<a
		// 				href="/website"
		// 				class="active:cursor-grabbing lg:w-[512px] max-w-lg w-full h-80 bg-surface-800 rounded-3xl flex-shrink-0 relative group overflow-hidden border border-primary/0 hover:border-background/20 transition-all"
		// 			>
		// 				<div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
		// 					<Website />
		// 				</div>
		// 				<div class="absolute inset-0 blur-3xl transition-all opacity-0 group-hover:opacity-25">
		// 					<Website />
		// 				</div>
		// 				<CardTag text="Website" globalPrefix />
		// 			</a>
		// 		</div>
		// 	</div>
		// </div> */
}
