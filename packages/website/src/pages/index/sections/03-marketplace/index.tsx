import { Button } from "../../components/Button.jsx"
import { SectionLayout } from "../../components/sectionLayout.jsx"
import ItemsList from "./assets/itemslist.jsx"
import MissingPart from "./assets/missingpart.jsx"

const Marketplace = () => {
	return (
		<>
			<SectionLayout showLines={true} type="white">
				<div class="mb-24">
					<div class="relative w-full pb-2">
						<img src="/images/landingpage/marketplace_apps.png" class="w-full max-w-5xl mx-auto" />
						<div class="absolute inset-0 z-10 bg-gradient-to-t from-surface-100/0 via-surface-100/0 via-70% to-surface-100/70 mix-blend-lighten" />
					</div>
					<div class="mx-auto flex flex-col items-center">
						<h1 class="text-center text-4xl md:text-[50px] font-bold mb-8">
							Explore the ecosystem
						</h1>
						<p class="text-center text-surface-600 md:text-xl text-lg mb-12">
							No matter your requirements,
							<br /> there is a module for that.
						</p>
						<Button type="primary" href="/marketplace">
							Browse Marketplace
						</Button>
					</div>
				</div>
				<div class="w-full flex pt-4 flex-col xl:flex-row mb-16">
					<div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-4 xl:py-16 pt-20 py-6">
						<div class="flex flex-col items-start">
							<div class="h-80 w-full rounded-xl bg-surface-100 mb-12 border border-surface-200 relative overflow-hidden">
								<div class="absolute left-1/2 -translate-x-1/2 -bottom-1">
									<ItemsList />
								</div>
							</div>
							<div class="rounded-full text-sm bg-primary/20 text-primary px-3 py-0.5 mb-4">
								Marketplace
							</div>
							<h2 class="text-xl font-semibold mb-4">Everything you need in one place</h2>
							<p>
								The marketplace provides you with the toolbox you need. With the wide range of
								modules you can solve every globalization problem you have. Use libraries to build
								on, plugins to enable features and rules to ensure and automate quality.
							</p>
						</div>
					</div>
					<div class="w-full xl:w-1/2 flex flex-col gap-8 px-6 md:px-4 xl:py-16 pt-20 py-6">
						<div class="flex flex-col items-start">
							<div class="h-80 w-full rounded-xl bg-surface-100 mb-12 border border-surface-200 relative overflow-hidden">
								<div class="absolute left-1/2 -translate-x-1/2 -bottom-1 w-full">
									<MissingPart />
								</div>
							</div>
							<div class="rounded-full text-sm bg-primary/20 text-primary px-3 py-0.5 mb-4">
								Custom modules
							</div>
							<h2 class="text-xl font-semibold mb-4">Haven’t found the missing part?</h2>
							<p class="mb-6">
								Extend the ecosystem by developing what's missing. You can develop your own app,
								plugins or rules and publish them to the marketplace.
							</p>
							<Button type="text" href="/documentation" chevron>
								inlang for Developers
							</Button>
						</div>
					</div>
				</div>
			</SectionLayout>
		</>
	)
}

export default Marketplace
