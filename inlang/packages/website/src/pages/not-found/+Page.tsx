import MarketplaceLayout from "#src/interface/marketplace/MarketplaceLayout.jsx";
import { Button } from "#src/pages/index/components/Button.jsx";
import Link from "#src/renderer/Link.jsx";
import { Meta, Title } from "@solidjs/meta";

export default function Page() {
	return (
		<>
			<Title>Item not found</Title>
			<Meta name="description" content="Marketplace item not found" />
			<Meta name="robots" content="noindex" />
			<MarketplaceLayout>
				<div class="relative max-w-screen-xl w-full mx-auto">
					<div class="invisible xl:visible absolute top-0 left-0 h-full w-full z-0">
						<div class="flex w-full h-full justify-between mx-auto items-end">
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
							<div />
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
							<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
						</div>
					</div>
					<div class="w-full flex pt-12 h-screen flex-col gap-16">
						<div class="w-full flex flex-col items-center gap-6 h-full mx-auto justify-center max-w-lg mt-32 mb-8 px-6 relative z-10">
							<h1 class="text-[40px] text-center leading-tight md:text-5xl font-bold text-surface-900 tracking-tight">
								Item not found
							</h1>
							<p class="text-lg text-surface-600 leading-relaxed mx-auto text-center mb-4">
								Seems like the item you are looking for does not exist. This is
								a bug? Please report it on our
								<Link
									class="text-primary hover:text-hover-primary font-semibold ml-1.5"
									href="https://discord.gg/gdMPPWy57R"
									target="_blank"
								>
									Discord
								</Link>
								.
							</p>
							<Button href="/" type="primary">
								Back to Marketplace
							</Button>
						</div>
						<div class="w-full h-screen relative">
							<div class="flex flex-col w-full h-full justify-end items-center">
								<div class="h-full w-[2px] bg-gradient-to-t from-surface-100 to-hover-primary relative z-0">
									<div class="w-full flex justify-center h-full z-3 ml-0">
										<div class="text-hover-primary bg-[#FFF] z-10 flex justify-center items-center text-center mx-auto h-12 w-12 rounded-full bg-white border-2 border-hover-primary absolute -top-6">
											<div class="w-0.5 rounded-full h-3/4 rotate-45 absolute bg-hover-primary" />
											<div class="w-0.5 rounded-full h-3/4 -rotate-45 absolute bg-hover-primary" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</MarketplaceLayout>
		</>
	);
}
