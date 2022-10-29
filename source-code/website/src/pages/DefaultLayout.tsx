import { Button } from "@src/components/Button.js";
import { Navigation } from "./documentation/Navigation.js";
const navigation = [
	{
		title: "Introduction",
		links: [
			{ title: "Getting started", href: "/" },
			{ title: "Installation", href: "/" },
		],
	},
	{
		title: "Introduction",
		links: [
			{ title: "Getting started", href: "/" },
			{ title: "Installation", href: "/" },
		],
	},
	{
		title: "Introduction",
		links: [
			{ title: "Getting started", href: "/" },
			{ title: "Installation", href: "/" },
		],
	},
	{
		title: "Introduction",
		links: [
			{ title: "Getting started", href: "/" },
			{ title: "Installation", href: "/" },
			{ title: "Getting started", href: "/" },
			{ title: "Installation", href: "/" },
			{ title: "Getting started", href: "/" },
			{ title: "Installation", href: "/" },
		],
	},
	{
		title: "Introduction",
		links: [
			{ title: "Getting started", href: "/" },
			{ title: "Installation", href: "/" },
		],
	},
];
export function DefaultLayout(props: { children: React.ReactNode }) {
	return (
		<>
			<div className="mx-auto max-w-7xl px-4   sm:px-6 lg:px-8">
				<Navbar></Navbar>
				{props.children}

				<div className="">
					<Navigation
						navigation={navigation}
						className="w-64 pr-8 xl:w-72 xl:pr-16"
					/>
				</div>
				{/* <div className="hidden lg:relative lg:block lg:flex-none">
					<div className="absolute inset-y-0 right-0 w-[50vw] bg-slate-50 dark:hidden" />
					<div className="absolute top-16 bottom-0 right-0 hidden h-12 w-px bg-gradient-to-t from-slate-800 dark:block" />
					<div className="absolute top-28 bottom-0 right-0 hidden w-px bg-slate-800 dark:block" />
					<div className="sticky top-[4.5rem] -ml-0.5 h-[calc(100vh-4.5rem)] overflow-y-auto overflow-x-hidden py-16 pl-0.5">
						<Navigation
							navigation={navigation}
							className="w-64 pr-8 xl:w-72 xl:pr-16"
						/>
					</div>
				</div> */}
			</div>
		</>
	);
}

function Navbar() {
	const navigation = [{ name: "Docs", href: "#" }];

	return (
		<header className=" bg-black">
			<nav aria-label="Top">
				<div className="flex w-full items-center justify-between bg-black border-b border-indigo-500 py-6 lg:border-none">
					<div className="flex items-center">
						<a href="#">
							<span className="sr-only">inlang</span>
							<img
								className="h-10 w-auto"
								src="https://tailwindui.com/img/logos/mark.svg?color=white"
								alt=""
							/>
						</a>
						<div className="ml-10 hidden space-x-8 lg:block">
							{navigation.map((link) => (
								<a
									key={link.name}
									href={link.href}
									className="text-base font-medium text-on-neutral hover:text-hover-primary"
								>
									{link.name}
								</a>
							))}
						</div>
					</div>
					{/* <div className="ml-10 space-x-4">
						<Button color="primary">
							<a href="/editor">Editor</a>
						</Button>
					</div> */}
				</div>
				<div className="flex flex-wrap justify-center space-x-6 py-4 bg-slate-800 lg:hidden">
					{navigation.map((link) => (
						<a
							key={link.name}
							href={link.href}
							className="text-base font-medium text-on-neutral hover:text-indigo-50"
						>
							{link.name}
						</a>
					))}
				</div>
			</nav>
		</header>
	);
}
