import IconTwitter from "~icons/cib/twitter";
import IconGithub from "~icons/cib/github";
export function Footer() {
	return (
		<footer
			aria-labelledby="footer-heading"
			class=" sm:fixed  inset-x-0 bottom-0 z-40 bg-background border-t border-outline  	"
		>
			<h2 id="footer-heading" class="sr-only">
				Footer
			</h2>
			{/* <div class="w-screen border-t border-gray-200	"></div> */}
			{/* <div class=" px-4 sm:px-6 lg:px-8 mx-auto flex  items-center justify-between  py-5  sm:py-4 md:justify-start md:space-x-10 "> */}
			<div class="mx-auto max-w-screen-2xl px-4  w-full  ">
				<div class="flex  items-center  md:order-2">
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
