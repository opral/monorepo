import type { JSXElement } from "solid-js";
import { Header } from "./index/Header.jsx";
import IconTwitter from "~icons/cib/twitter";
import IconGithub from "~icons/cib/github";
// command-f this repo to find where the layout is called
export function Layout(props: { children: JSXElement }) {
	return (
		<div class="flex flex-col  min-h-screen ">
			<Header />
			{/* <div class="bg-on-surface h-full max-h-full min-h-full">f</div> */}
			<div class=" px-4 md:px-0 md:my-auto min-h-full ">{props.children}</div>
			<Footer />
		</div>
	);
}

function Footer() {
	return (
		<footer class=" sticky z-40 top-0 border-t  border-outline w-full ">
			<div class="mx-auto max-w-screen-2xl px-4">
				<div class=" flex gap-8 p-1 bg-background">
					{/* <footer
			aria-labelledby="footer-heading"
			class="px-4  w-full z-40 bg-background border-t border-outline"
		> */}
					{/* <div class="w-screen border-t border-gray-200	"></div> */}
					{/* <div class=" px-4 sm:px-6 lg:px-8 mx-auto flex  items-center justify-between  py-5  sm:py-4 md:justify-start md:space-x-10 "> */}
					{/* <div class="mx-auto max-w-screen-2xl">
				<div class=" flex  items-center    md:order-2 max-w-screen-2xl"> */}
					<a href="/legal.txt" class="link  link-primary font-light">
						<span class="">legal.txt</span>
					</a>
					<div class="flex  grow justify-end items-center  space-x-4 ">
						<a href="mailto:hello@inlang.com" class="link link-primary ">
							hello@inlang.com
						</a>

						<a
							href="https://twitter.com/inlangHQ"
							class="text-gray-400 hover:text-gray-500 justify-self-start	"
						>
							<span class="sr-only ">Twitter</span>
							<IconTwitter />
						</a>
						<a
							href="https://github.com/inlang/inlang"
							class="link link-primary flex "
						>
							<span class="sr-only ">GitHub</span>
							<IconGithub></IconGithub>
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
