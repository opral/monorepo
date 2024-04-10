import { For, Show } from "solid-js"
import UserDropdown from "./UserDropdown.jsx"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import { Button } from "../components/Button.jsx"
import { getFinkResourcesLinks } from "./Footer.jsx"

function EditorHeader() {
	const [localStorage] = useLocalStorage()
	const user = () => {
		if (!localStorage) return undefined
		return localStorage.user
	}

	return (
		<>
			<header class="sticky top-0 left-0 right-0 z-[100] w-full bg-transparent bg-background py-3.5 px-4 border-b border-surface-200">
				<div class="w-full h-full relative z-10 bg-background max-w-7xl mx-auto flex flex-row justify-between sm:static">
					<nav class="max-w-[1248px] w-full mx-auto">
						<div class="flex items-center">
							<a
								href={import.meta.env.PROD ? "https://inlang.com" : "http://localhost:3000"}
								target="_blank"
								class="flex items-center w-fit pointer-events-auto transition-opacity hover:opacity-75"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									version="1.0"
									viewBox="0 0 256.000000 256.000000"
									preserveAspectRatio="xMidYMid meet"
									width="2rem"
									height="2rem"
								>
									<metadata>Created by potrace 1.14, written by Peter Selinger 2001-2017</metadata>
									<g
										transform="translate(0.000000,256.000000) scale(0.100000,-0.100000)"
										fill="#000000"
										stroke="none"
									>
										<path d="M95 2546 c-41 -18 -83 -69 -90 -109 -3 -18 -4 -550 -3 -1184 3 -1145 3 -1152 24 -1179 11 -15 33 -37 48 -48 27 -21 31 -21 1206 -21 1175 0 1179 0 1206 21 15 11 37 33 48 48 21 27 21 31 21 1206 0 1175 0 1179 -21 1206 -11 15 -33 37 -48 48 -27 21 -33 21 -1194 23 -955 2 -1173 0 -1197 -11z m570 -630 c81 -34 97 -133 31 -193 -29 -27 -44 -33 -81 -33 -83 0 -135 47 -135 122 0 40 21 73 64 99 37 23 74 24 121 5z m1435 -636 l0 -580 -120 0 -120 0 0 580 0 580 120 0 120 0 0 -580z m-566 270 c63 -32 109 -89 135 -167 20 -58 21 -84 21 -373 l0 -310 -120 0 -120 0 0 278 c0 252 -2 281 -20 319 -24 55 -70 83 -134 83 -66 0 -120 -32 -146 -85 -19 -38 -20 -62 -20 -318 l0 -277 -120 0 -120 0 0 435 0 435 115 0 114 0 3 -77 c2 -58 6 -73 12 -58 27 58 79 103 151 132 17 7 66 11 115 10 68 -2 95 -7 134 -27z m-804 -415 l0 -435 -120 0 -120 0 0 435 0 435 120 0 120 0 0 -435z" />
									</g>
								</svg>
							</a>
							<p class="self-center text-left font-regular text-surface-400 pl-4 pr-1">/</p>
							<a
								class="self-center pl-2 text-left font-medium text-surface-900 hover:text-primary transition-colors duration-150"
								href={import.meta.env.PROD ? "https://fink.inlang.com" : "http://localhost:4003"}
							>
								Fink
							</a>
							<div class="w-full content-center">
								<div
									class={
										"flex justify-end items-center gap-6 transition-[margin] duration-200 -my-1 " +
										(user()?.isLoggedIn && "mr-14")
									}
								>
									<Button type="text" class="hidden sm:flex"
										href={import.meta.env.PROD
										? "https://inlang.com/c/lint-rules"
										: "http://localhost:3000/c/lint-rules"}>
										Find Lint Rules
									</Button>
									<sl-dropdown prop:placement="bottom-end" class="peer">
										<button slot="trigger" class="flex pointer-events-auto justify-center items-center h-10 relative gap-2 rounded-md flex-grow-0 flex-shrink-0 text-sm font-medium text-left cursor-pointer transition-all duration-200 text-surface-700 hover:text-primary">
											Need Help?
										</button>
										<sl-menu class="w-fit">
											<For each={getFinkResourcesLinks()}>
												{(link) => (
													<>
														<sl-menu-item>
															<a href={link.href} target="_blank">
																{link.name}
															</a>
														</sl-menu-item>
														<Show
															when={link.name === "About the ecosystem"}
														>
															<div class="w-full border-b border-surface-200 my-1" />
														</Show>
													</>
												)}
											</For>
										</sl-menu>
									</sl-dropdown>
									<Show when={user()?.isLoggedIn}>
										<div class="absolute h-8 right-0 sm:right-4 xl:right-[calc((100%_-_1240px)_/_2)] animate-fadeIn">
											<UserDropdown />
										</div>
									</Show>
								</div>
							</div>
							{/* Controll the Dropdown/Navbar  if its open then Show MobileNavMenue */}
							{/* <div class="md:hidden flex items-center">
								<button
									onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen())}
									type="button"
									class="inline-flex items-center justify-center text-primary "
								>
									<span class="sr-only">{mobileMenuIsOpen() ? "Close menu" : "Open menu"}</span>
									{mobileMenuIsOpen() ? (
										<IconClose class="w-6 h-6" />
									) : (
										<IconMenu class="w-6 h-6" />
									)}
								</button>
							</div> */}
						</div>
						{/* MobileNavbar includes the Navigation for the Documentations sites  */}
						{/* <Show when={mobileMenuIsOpen()}>
							<ol class="space-y-1 relativ w-full min-h-full pt-3 pl-[5px] overflow">
								<For each={getLinks()}>
									{(link) => (
										<sl-tree>
											<Link
												class="link grow min-w-full text-on-surface link-primary w-full"
												href={link.href}
												onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen())}
											>
												<sl-tree-item>{link.name}</sl-tree-item>
											</Link>
										</sl-tree>
									)}
								</For>
							</ol>
						</Show> */}
					</nav>
				</div>
			</header>
		</>
	)
}

export default EditorHeader
