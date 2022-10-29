import { clsx } from "clsx";
import { usePageContext } from "@src/renderer/hooks/usePageContext.js";
import { Link } from "./Link.js";
export function Navigation(props: {
	navigation: Array<{
		title: string;
		links: Array<{ href: string; title: string }>;
	}>;
	className: string;
}) {
	let pageContext = usePageContext();

	return (
		<nav className={clsx("text-base lg:text-sm", props.className)}>
			<Link href={"/block"}> komme ich weiter</Link>
			<ul
				role="list"
				className="space-y-9 h-[calc(100vh-4.5rem)] overflow-y-auto overflow-x-hidden pl-0.5 pb-16    "
			>
				{props.navigation.map((section) => (
					<li key={section.title}>
						<h2
							className="font-display font-medium text-slate-900 py-2 border-t-2
							 lg:py-4 "
						>
							{section.title}
						</h2>
						<ul
							role="list"
							className="mt-2 space-y-2 border-l-2 border-slate-100  lg:mt-4 lg:space-y-4 lg:border-slate-200"
						>
							{section.links.map((link) => (
								<li key={link.href} className="relative">
									<Link
										href={link.href}
										className={clsx(
											"block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full",
											link.href === pageContext.urlPathname
												? "font-semibold text-sky-500 before:bg-sky-500"
												: "text-slate-500 before:hidden before:bg-slate-300 hover:text-slate-600 hover:before:block "
										)}
									>
										{link.title}
									</Link>
								</li>
							))}
						</ul>
					</li>
				))}
			</ul>
		</nav>
	);
}
