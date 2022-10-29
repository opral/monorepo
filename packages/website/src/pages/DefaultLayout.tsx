import { Button } from "@src/components/Button.js";

export function DefaultLayout(props: { children: React.ReactNode }) {
	return (
		<>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<Navbar></Navbar>
				{props.children}
			</div>
		</>
	);
}

function Navbar() {
	const navigation = [{ name: "Docs", href: "#" }];

	return (
		<header className="bg-neutral">
			<nav aria-label="Top">
				<div className="flex w-full items-center justify-between border-b border-indigo-500 py-6 lg:border-none">
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
					<div className="ml-10 space-x-4">
						<Button color="primary">
							<a href="/editor">Editor</a>
						</Button>
					</div>
				</div>
				<div className="flex flex-wrap justify-center space-x-6 py-4 lg:hidden">
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
