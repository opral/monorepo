import * as m from "#src/paraglide/messages.js";
import { Button } from "../components/Button.jsx";
import { Show, createSignal } from "solid-js";

const isProduction = process.env.NODE_ENV === "production";

const HeroSearch = () => {
	const [open, setOpen] = createSignal(false);

	return (
		<div class="relative grid grid-cols-12">
			{/* <Show when={open()}>
				<sl-dialog
					prop:label="What is inlang?"
					class="video-dialog"
					prop:open={open()}
					on:sl-after-hide={() => setOpen(false)}
				>
					<div
						style={{
							position: "relative",
							"padding-bottom": "56.25%",
							height: "0",
						}}
					>
						<iframe
							src="https://www.loom.com/embed/f35656b7ac464f57816793c79bb7938b?sid=f96b57bd-6f45-45ac-ba43-814857598ce1"
							frame-border="0"
							web-kit-allow-fullscreen
							moz-allow-fullscreen
							allow-fullscreen
							style={{
								position: "absolute",
								top: "0",
								left: "0",
								width: "100%",
								height: "100%",
							}}
						/>
					</div>
				</sl-dialog>
			</Show> */}
			<div class="col-span-12 lg:col-span-6 items-center lg:items-start relative z-30 flex flex-col gap-2 pb-6 mt-4 md:mt-8">
				{/* <CredibilityTag projectCount={props.projectCount} /> */}

				<h1 class="text-4xl md:text-6xl text-surface-900 text-center lg:text-start font-bold tracking-tight mt-6">
					{m.home_inlang_title()}
				</h1>
				<p class="text-center lg:text-start text-xl max-w-[600px] text-surface-500 pt-5">
					{addLinksToText(m.home_inlang_description())}
				</p>

				<div class="mt-8 flex gap-2 flex-wrap justify-center lg:justify-start">
					<Button class="w-fit rounded-lg" type="primary" href="/c/apps">
						{m.home_inlang_cta()}
					</Button>
					<Button
						href="https://github.com/opral/inlang-sdk"
						type="secondary"
						target="_blank"
						class="pointer-events-auto flex justify-center items-center h-10 relative gap-2 rounded-md flex-grow-0 flex-shrink-0 text-sm font-medium text-left cursor-pointer transition-all duration-200 text-surface-800 bg-surface-200 hover:text-surface-900 hover:bg-surface-300 px-4"
					>
						{m.home_inlang_button()}
					</Button>
				</div>
			</div>
			<div class="col-span-12 lg:col-span-6 mb-10 lg:mb-0 mt-6 lg:mt-16 overflow-hidden flex items-center justify-center w-full">
				<img
					class="w-full max-w-[600px] lg:ml-auto"
					src="/images/go-global-mockup.png"
					alt="lix header image"
				/>
			</div>
		</div>
	);
};

export default HeroSearch;

function addLinksToText(text: string) {
	const replacements: { [key: string]: string } = {
		"lix apps": `https://lix.opral.com`,
		"use case": `${isProduction ? `https://inlang.com?` : "http://localhost:3000?"}#personas`,
	};

	const elements = [];
	let lastIndex = 0;

	for (const phrase in replacements) {
		if (Object.prototype.hasOwnProperty.call(replacements, phrase)) {
			const url = replacements[phrase];
			const regex = new RegExp(`\\b${phrase}\\b`, "g");
			const matches = [...text.matchAll(regex)];

			for (const match of matches) {
				const index: number = match.index || 0;
				elements.push(text.slice(lastIndex, index));

				if (
					url?.includes("https://inlang.com") ||
					url?.includes("http://localhost:3000")
				) {
					elements.push(
						<a
							href={url}
							class="font-semibold text-surface-900 hover:opacity-70 underline underline-offset-2"
							onClick={(e) => {
								e.preventDefault();
								scrollToAnchor(url!.split("#")[1]!, "smooth");
							}}
						>
							{phrase}
						</a>
					);
				} else {
					elements.push(
						<a
							href={url}
							target="_blank"
							class="font-semibold text-surface-900 hover:opacity-70 underline underline-offset-2"
						>
							{phrase}
						</a>
					);
				}

				lastIndex = index + match[0].length;
			}
		}
	}

	elements.push(text.slice(Math.max(0, lastIndex)));

	return elements;
}

const scrollToAnchor = (anchor: string, behavior?: ScrollBehavior) => {
	const element = document.getElementById(anchor);
	if (element && window) {
		window.scrollTo({
			top: element.offsetTop - 96,
			behavior: behavior ?? "instant",
		});
	}
	//window.history.pushState({}, "", `${currentPageContext.urlParsed.pathname}#${anchor}`)
};
