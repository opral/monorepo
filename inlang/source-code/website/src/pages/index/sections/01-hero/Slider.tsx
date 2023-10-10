import { createSignal, createMemo, createEffect } from "solid-js"
import App from "./assets/categories/app.jsx"
import Email from "./assets/categories/email.jsx"
import Payments from "./assets/categories/payments.jsx"
import Website from "./assets/categories/website.jsx"
import Documents from "./assets/categories/documents.jsx"
import { CardTag } from "../../components/CardTag.jsx"
import { createSlider } from "solid-slider"
import { adaptiveWidth } from "solid-slider/plugins/adaptiveWidth"
import "solid-slider/slider.css"

export default function CategorieSlider() {
	const slidesView = () => {
		if (typeof window !== "undefined") {
			if (window.innerWidth < 870) {
				return 1
			} else if (window.innerWidth < 1350) {
				return 2
			} else if (window.innerWidth < 1700) {
				return 3
			} else {
				return 4
			}
		} else {
			return 4
		}
	}

	const [details, setDetails] = createSignal({})
	const [slider, { current, next, prev, moveTo }] = createSlider({
		slides: {
			number: 5,
			perView: slidesView(),
			spacing: 128,
		},
		loop: true,
		plugins: [adaptiveWidth],

		detailsChanged: (slider) => {
			setDetails(slider.track.details)
		},
	})

	const slidesLength = createMemo(() => {
		console.log(details())
		return details()?.length + 1
	})

	return (
		<>
			<div use:slider class="xl:pl-64">
				<div class="flex justify-center items-center md:px-0 px-3">
					<a
						href="/documents"
						class="max-w-sm w-full h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative group border border-primary/0 hover:border-background/20 transition-all"
					>
						<div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 overflow-hidden">
							<Documents />
						</div>
						{/* Used for making blurry hover effects possible  */}
						<div class="absolute inset-0 blur-3xl transition-all opacity-0 group-hover:opacity-25">
							<Documents />
						</div>
						<CardTag text="Documents" globalPrefix />
					</a>
				</div>
				<div class="flex justify-center items-center md:px-0 px-3">
					<a
						href="/app"
						class="lg:w-[512px] max-w-lg w-full h-80 bg-surface-800 rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0 hover:border-background/20 transition-all"
					>
						<div class="absolute -right-4 bottom-0 z-10">
							<App />
						</div>
						{/* Used for making blurry hover effects possible  */}
						<div class="absolute inset-0 transition-all blur-md opacity-0 group-hover:opacity-100">
							<App />
						</div>
						<CardTag text="App" globalPrefix />
					</a>
				</div>
				<div class="flex justify-center items-center md:px-0 px-3">
					<a
						href="/email"
						class="max-w-sm w-full h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0 hover:border-background/20 transition-all"
					>
						<div class="absolute right-0 bottom-0 z-10">
							<Email />
						</div>
						{/* Used for making blurry hover effects possible  */}
						<div class="absolute inset-0 transition-all blur-2xl opacity-0 group-hover:opacity-25">
							<Email />
						</div>
						<CardTag text="Email" globalPrefix />
					</a>
				</div>
				<div class="flex justify-center items-center md:px-0 px-3">
					<a
						href="/payments"
						class="max-w-sm w-full h-80 bg-surface-700 rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0 hover:border-background/20 transition-all"
					>
						<div class="absolute left-1/2 -translate-x-1/2 bottom-0 z-10">
							<Payments />
						</div>
						{/* Used for making blurry hover effects possible  */}
						<div class="absolute inset-0 transition-all blur-2xl opacity-0 group-hover:opacity-25">
							<Payments />
						</div>
						<CardTag text="Payments" globalPrefix />
					</a>
				</div>
				<div class="flex justify-center items-center md:px-0 px-3">
					<a
						href="/website"
						class="lg:w-[512px] max-w-lg w-full h-80 bg-surface-800 rounded-3xl flex-shrink-0 relative group overflow-hidden border border-primary/0 hover:border-background/20 transition-all"
					>
						<div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
							<Website />
						</div>
						{/* Used for making blurry hover effects possible  */}
						<div class="absolute inset-0 blur-3xl transition-all opacity-0 group-hover:opacity-25">
							<Website />
						</div>
						<CardTag text="Website" globalPrefix />
					</a>
				</div>
			</div>
		</>
	)
}
