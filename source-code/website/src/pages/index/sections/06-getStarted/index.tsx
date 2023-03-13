import { Button } from "../../components/Button.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"

const data = {
	subtitle: "How to get started?",
	title: "Generate your config file to get started.",
	body: "Simply add the config and you're good to go. Our seamless integration ensures effortless adoption and a hassle-free user experience. Say goodbye to confusion and hello to streamlined localization with inlang.",
}

const GetStarted = () => {
	return (
		<>
			<SectionLayout type="lightGrey">
				<div class="relative">
					<div class="relative z-10 py-10">
						<div class="md:grid md:grid-cols-2">
							<div class="px-10 pt-10 pb-10 flex flex-col gap-8">
								<div class="flex justify-center items-center w-fit h-7 relative gap-2 px-3 rounded-full bg-primary/[0.16]">
									<p class="flex-grow-0 flex-shrink-0 text-xs font-semibold text-center text-primary">
										{data.subtitle}
									</p>
								</div>
								<h2 class={"text-3xl font-semibold text-surface-900"}>{data.title}</h2>
								<div class="gap-x-10 text-surface-700">{data.body}</div>
								<div class="flex gap-8 items-center">
									<Button type="secondaryOnGray" chevron>
										View Docs
									</Button>
								</div>
							</div>
							<div class="justify-center px-10 md:pt-10 pb-10 flex flex-col gap-8">
								<div class="rounded-lg bg-background border border-surface-200 shadow-sm p-6">
									<p class="text-base font-semibold text-left text-surface-900 pb-3">
										Generate your Config file
									</p>
									<p class="text-sm font-medium text-left text-surface-600 pb-6">
										We check your repo structure to generate the config that fits to your needs.
									</p>
									<div class="flex flex-row gap-2">
										<input
											placeholder="Enter your repo url ..."
											class="w-full bg-background border border-surface-200 rounded px-3 py-2 text-sm font-medium text-left text-surface-600 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-surface-800 focus:border-transparent"
										/>
										<Button type="primary">Generate</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</SectionLayout>
		</>
	)
}

export default GetStarted
