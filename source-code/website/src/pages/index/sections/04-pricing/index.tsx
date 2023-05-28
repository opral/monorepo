import { SectionLayout } from "../../components/sectionLayout.jsx"
import { Button } from "../../components/Button.jsx"

const data = {
	title: "Free for individual use and open source",
	caption: "Pricing",
	description: `Inlang is a commercial product. But, individual use and open source stays free. We see individual use as good "marketing" that helps us acquiring enterprise customers.`,
	button: "Read the discussion on GitHub",
	buttonLink: "https://github.com/inlang/inlang",
}

const Pricing = () => {
	return (
		<SectionLayout type="white" showLines={true}>
			<div class="flex justify-between px-10 py-20 lg:py-32 gap-16 lg:gap-0 flex-col lg:flex-row">
				<div class="w-full lg:w-[calc((100%_-_40px)_/_2)] flex flex-col gap-2 lg:gap-4 items-center lg:items-start">
					<p class="text-xs text-center lg:text-start text-primary bg-primary/10 h-7 flex items-center px-4 rounded-full w-fit">
						{data.caption}
					</p>
					<h2 class="text-3xl text-center lg:text-start  font-semibold text-on-background leading-relaxed tracking-tight">
						{data.title}
					</h2>
					<p class="text-base text-center lg:text-start md:w-[80%] text-outline-variant">
						{data.description}
					</p>
					<div class="pt-4">
						<Button href={data.buttonLink} type="secondary">
							{data.button}
						</Button>
					</div>
				</div>
				<div class="w-full lg:w-[calc((100%_-_40px)_/_2)] flex items-end lg:pl-4">
					<div class="h-full w-[55%] rounded-2xl rounded-br-none flex flex-col p-6 lg:p-8 gap-4 bg-gradient-to-b from-hover-primary/70 to-hover-primary/30">
						<p class="h-7 flex items-center px-3 rounded-full bg-background/50 w-fit text-surface-600 text-sm">
							free
						</p>
						<p class="grow font-semibold text-lg lg:text-xl text-surface-900/80">
							Individuals and Open Source
						</p>
						<p class="font-semibold text-surface-900 text-3xl">$0</p>
					</div>
					<div class="h-[80%] w-[45%] rounded-2xl rounded-l-none flex flex-col p-6 lg:p-8 gap-4 bg-surface-1 border border-surface-2">
						<p class="h-7 flex items-center px-3 rounded-full bg-surface-500/10 w-fit text-surface-600 text-sm">
							paid
						</p>
						<p class="grow font-semibold text-lg lg:text-xl text-surface-900/80">Enterprise</p>
						<p class="font-semibold text-surface-900 text-3xl">soon</p>
					</div>
				</div>
			</div>
		</SectionLayout>
	)
}

export default Pricing
