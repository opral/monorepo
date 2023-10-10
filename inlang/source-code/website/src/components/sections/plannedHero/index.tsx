import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"
import type { JSX } from "solid-js"

const PlannedHero = (props: {
  title: string,
  description: string,
  image: JSX.Element,
}) => {
  return (
		<>
			<SectionLayout showLines={true} type="dark">
				<div class="w-full flex px-6 md:px-10 pt-40 lg:pt-32 pb-24 md:pb-24 flex-col-reverse lg:flex-row min-h-[calc(100vh+1rem)]">
					<div class="w-full lg:w-1/2 flex flex-col gap-8 pt-20 lg:pt-24">
						<h1 class="text-[40px] leading-tight md:text-6xl font-bold text-background pr-16 tracking-tight">
							inlang <br />
							<span class="bg-clip-text text-[rgba(0,0,0,0)] bg-gradient-to-tl from-[#F1D9FF] via-hover-primary to-[#3B82F6]">
								{props.title}
							</span>
						</h1>
						<p class="text-surface-300 text-xl max-w-sm">{props.description}</p>
						<div class="flex md:items-center items-start gap-8">
							<a href={"/"} class="-ml-0.5 flex-shrink-0">
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
					<div class="w-full lg:w-1/2 lg:pt-24">{props.image}</div>
				</div>
			</SectionLayout>
		</>
	)
}

export default PlannedHero
