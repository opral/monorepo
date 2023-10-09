import App from "./assets/categories/app.jsx"
import Email from "./assets/categories/email.jsx"
import Payments from "./assets/categories/payments.jsx"
import Website from "./assets/categories/website.jsx"
import Documents from "./assets/categories/documents.jsx"
import { CardTag } from "../../components/CardTag.jsx"
import "solid-slider/slider.css"
import { Slider } from "solid-slider"
import { adaptiveWidth } from "solid-slider/plugins/adaptiveWidth"

export default function CategorieSlider() {
	return (
		<Slider options={{ loop: true }} plugins={[adaptiveWidth]}>
			<div class="flex items-center justify-center gap-4">
				<a
					href="/documents"
					class="w-96 h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative group border border-primary/0 hover:border-background/20 transition-all"
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
				<a
					href="/app"
					class="w-[512px] h-80 bg-surface-800 rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0 hover:border-background/20 transition-all"
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
				<a
					href="/email"
					class="w-96 h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0 hover:border-background/20 transition-all"
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
			<div class="flex items-center justify-center gap-4">
				<a
					href="/payments"
					class="w-96 h-80 bg-surface-700 rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0 hover:border-background/20 transition-all"
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
				<a
					href="/website"
					class="w-[512px] h-80 bg-surface-800 rounded-3xl flex-shrink-0 relative group overflow-hidden border border-primary/0 hover:border-background/20 transition-all"
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
				<a
					href="/"
					class="w-96 h-80 bg-[#043855] rounded-3xl flex-shrink-0 relative overflow-hidden group border border-primary/0 hover:border-background/20 transition-all"
				>
					<div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
						<span class="text-6xl font-bold text-background">?</span>
					</div>
					{/* Used for making blurry hover effects possible  */}
					<div class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
						<span class="text-6xl scale-125 font-bold text-background">?</span>
					</div>
					<CardTag text="Coming soon" />
				</a>
			</div>
		</Slider>
	)
}
