import { clsx } from "clsx";

const styles = {
	link: "block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-1 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full hover:text-red-600	 transition-colors	duration-300	 ",
};

export function Link({ variant = "link", className, href, ...props }) {
	className = clsx(styles[variant], className);

	return href ? (
		<a href={href} className={className} {...props} />
	) : (
		<button className={className} {...props} />
	);
}
