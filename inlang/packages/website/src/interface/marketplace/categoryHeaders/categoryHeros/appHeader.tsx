import { LixBadge } from "#src/interface/components/Card.jsx";
import Link from "#src/renderer/Link.jsx";
import { registry } from "@inlang/marketplace-registry";
import { For, Match, Show, Switch } from "solid-js";

const AppHeader = () => {
	const featured = [
		"app.inlang.finkLocalizationEditor",
		"app.inlang.ideExtension",
		"app.parrot.figmaPlugin",
	];

	return (
		<>
			<div class="flex flex-row w-full justify-between pb-8 flex-wrap gap-y-4">
				<For each={featured}>
					{(product) => {
						const manifest = registry.find(
							(manifest) => manifest.id === product
						);
						if (!manifest) {
							return undefined;
						}
						const displayName = () =>
							typeof manifest.displayName === "object"
								? manifest.displayName.en
								: manifest.displayName;

						const description = () =>
							typeof manifest.description === "object"
								? manifest.description.en
								: manifest.description;

						return (
							<Link
								href={
									manifest.id.split(".")[0] === "guide"
										? `/g/${manifest.uniqueID}/${manifest.id.replaceAll(
												".",
												"-"
										  )}`
										: `/m/${manifest.uniqueID}/${manifest.id.replaceAll(
												".",
												"-"
										  )}`
								}
								class="group sm:w-[calc((100%_-_16px)_/_2)] lg:w-[calc((100%_-_32px)_/_3)] bg-background border border-surface-200 rounded-xl overflow-hidden hover:border-surface-300 transition-all cursor-pointer"
							>
								<div class="w-full h-[200px] overflow-hidden">
									<Switch>
										<Match
											when={manifest.id === "app.inlang.finkLocalizationEditor"}
										>
											<img
												class="group-hover:scale-105 h-full w-full bg-surface-400 object-cover transition-all duration-500"
												src={"/images/fink-cover.png"}
												alt={manifest.description as string}
											/>
										</Match>
										<Match when={manifest.id === "app.inlang.ideExtension"}>
											<img
												class="group-hover:scale-105 h-full w-full bg-surface-400 object-cover transition-all duration-500"
												src={"/images/ide-cover.png"}
												alt={manifest.description as string}
											/>
										</Match>
										<Match when={manifest.id === "app.parrot.figmaPlugin"}>
											<img
												class="group-hover:scale-105 h-full w-full bg-surface-400 object-cover transition-all duration-500"
												src={"/images/parrot-cover.png"}
												alt={manifest.description as string}
											/>
										</Match>
									</Switch>
								</div>

								<div class="p-5 flex flex-col gap-5">
									<div class="flex gap-5 items-center">
										<img
											class="h-10 w-10 object-cover rounded"
											src={manifest.icon}
											alt={displayName()}
										/>
										<div class="flex-1">
											<div class="w-full font-bold text-surface-900 tracking-tight">
												{displayName()}
											</div>
										</div>
									</div>
									<div class="text-surface-500 text-md font-regular line-clamp-2">
										{description()}
									</div>
									<div class="flex flex-row-reverse justify-between items-center h-[30px]">
										<div class="w-5 text-primary group transition-colors relative z-60">
											<LixBadge />
										</div>
										<Show
											when={
												// @ts-ignore (Show components are not typed)
												manifest.pricing
											}
										>
											<div class="h-[30px] px-4 rounded-full bg-surface-200 flex items-center text-surface-500 font-semibold text-[13px]">
												{
													// @ts-ignore
													manifest.pricing.toUpperCase()
												}
											</div>
										</Show>
									</div>
								</div>
							</Link>
						);
					}}
				</For>
			</div>
		</>
	);
};

export default AppHeader;

export function InlangBadge() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="23"
			height="23"
			fill="none"
			viewBox="0 0 24 25"
		>
			<path
				fill="#000"
				d="M21.558 7.968c.028-.209.042-.418.042-.625 0-2.855-2.572-5.146-5.425-4.758A4.794 4.794 0 0012 .143c-1.76 0-3.343.962-4.175 2.442C4.965 2.197 2.4 4.488 2.4 7.343c0 .207.014.416.042.625A4.797 4.797 0 000 12.143c0 1.758.962 3.342 2.442 4.174a4.772 4.772 0 00-.042.626c0 2.854 2.566 5.14 5.425 4.758A4.794 4.794 0 0012 24.143c1.76 0 3.343-.963 4.175-2.442 2.853.381 5.425-1.904 5.425-4.758 0-.208-.014-.417-.042-.626A4.797 4.797 0 0024 12.143a4.797 4.797 0 00-2.442-4.175z"
			/>
			<path
				fill="url(#paint0_linear_3177_12279)"
				d="M21.558 7.968c.028-.209.042-.418.042-.625 0-2.855-2.572-5.146-5.425-4.758A4.794 4.794 0 0012 .143c-1.76 0-3.343.962-4.175 2.442C4.965 2.197 2.4 4.488 2.4 7.343c0 .207.014.416.042.625A4.797 4.797 0 000 12.143c0 1.758.962 3.342 2.442 4.174a4.772 4.772 0 00-.042.626c0 2.854 2.566 5.14 5.425 4.758A4.794 4.794 0 0012 24.143c1.76 0 3.343-.963 4.175-2.442 2.853.381 5.425-1.904 5.425-4.758 0-.208-.014-.417-.042-.626A4.797 4.797 0 0024 12.143a4.797 4.797 0 00-2.442-4.175z"
			/>
			<path
				fill="#fff"
				d="M5.508 17.143v-7.091H7.18v7.09H5.51zm.84-8.098a.975.975 0 01-.683-.263.848.848 0 01-.286-.642c0-.252.095-.466.286-.641a.966.966 0 01.683-.268c.268 0 .496.09.684.268.19.175.286.39.286.641 0 .25-.096.464-.286.642a.964.964 0 01-.684.263zm4.22 3.943v4.155h-1.67v-7.091h1.597v1.205h.083c.163-.397.423-.713.78-.947.36-.234.805-.35 1.335-.35.489 0 .915.104 1.278.313.367.21.65.513.85.91.203.397.303.878.3 1.445v4.515H13.45v-4.257c0-.474-.123-.845-.37-1.112-.243-.268-.58-.402-1.01-.402-.293 0-.553.065-.78.194-.226.126-.403.31-.532.55-.126.24-.19.53-.19.872zm7.923-5.3v9.455H16.82V7.688h1.67z"
			/>
			<defs>
				<linearGradient
					id="paint0_linear_3177_12279"
					x1="24"
					x2="-1.257"
					y1="10.743"
					y2="15.221"
					gradientUnits="userSpaceOnUse"
				>
					<stop stop-color="#17CAEB" />
					<stop offset="1" stop-color="#63B0FF" />
				</linearGradient>
			</defs>
		</svg>
	);
}
