import { useI18n } from "@solid-primitives/i18n"
import { SectionLayout } from "../../components/sectionLayout.jsx"

const Pricing = () => {
	const [t] = useI18n()

	return (
		<SectionLayout type="white" showLines={true}>
			<div class="flex justify-between px-6 md:px-10 py-16 sm:py-20 lg:py-32 gap-16 lg:gap-0 flex-col lg:flex-row">
				<div class="w-full lg:w-[calc((100%_-_40px)_/_2)] flex flex-col gap-2 lg:gap-4 items-center lg:items-start">
					<p class="text-sm text-center lg:text-start text-primary bg-primary/10 h-7 flex items-center px-4 rounded-full w-fit tracking-relaxed">
						{t("landing.pricing.caption")}
					</p>
					<h2 class="text-3xl text-center lg:text-start  font-semibold text-on-background leading-tight md:leading-relaxed tracking-tight">
						{t("landing.pricing.title")}
					</h2>
					<p class="text-base text-center lg:text-start md:w-[80%] text-outline-variant sm:leading-7 pb-16">
						{t("landing.pricing.description")}
					</p>
				</div>
				<div class="w-full lg:w-[calc((100%_-_40px)_/_2)] flex items-end lg:pl-4">
					<div class="h-full w-[55%] rounded-2xl rounded-br-none flex flex-col p-6 lg:p-8 gap-4 bg-gradient-to-b from-hover-primary/70 to-hover-primary/30">
						<p class="h-7 flex items-center px-3 rounded-full bg-background/50 w-fit text-surface-600 text-sm">
							{t("landing.pricing.free.name")}
						</p>
						<p class="grow font-semibold text-lg lg:text-xl text-surface-900/80">
							{t("landing.pricing.free.title")}
						</p>
						<p class="font-semibold text-surface-900 text-3xl">
							{t("landing.pricing.free.amount")}
						</p>
					</div>
					<div class="h-[80%] w-[45%] rounded-2xl rounded-l-none flex flex-col p-6 lg:p-8 gap-4 bg-surface-1 border border-surface-2">
						<p class="h-7 flex items-center px-3 rounded-full bg-surface-500/10 w-fit text-surface-600 text-sm">
							{t("landing.pricing.paid.name")}
						</p>
						<p class="grow font-semibold text-lg lg:text-xl text-surface-900/80">
							{t("landing.pricing.paid.title")}
						</p>
						<p class="font-semibold text-surface-900 text-3xl">
							{t("landing.pricing.paid.amount")}
						</p>
					</div>
				</div>
			</div>
		</SectionLayout>
	)
}

export default Pricing
