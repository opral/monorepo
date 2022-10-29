import { clsx } from "clsx";

const styles = {
	link: "rounded-full bg-sky-300 py-2 px-4 text-sm font-semibold text-slate-900 hover:bg-sky-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300/50 active:bg-sky-500",
};

export function Link({ variant = "link", className, href, ...props }) {
	className = clsx(styles[variant], className);

	return href ? (
		<a href={href} className={className} {...props} />
	) : (
		<button className={className} {...props} />
	);
}
