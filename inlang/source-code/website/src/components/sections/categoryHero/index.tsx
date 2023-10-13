import { SectionLayout } from "#src/pages/index/components/sectionLayout.jsx"
import type { PageProps } from "#src/pages/Category.jsx"

const CategoryHero = (props: PageProps) => {
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
				</div>
			</SectionLayout>
		</>
	)
}

export default CategoryHero
