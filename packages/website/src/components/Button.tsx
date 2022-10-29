import type { DesignSystemColors } from "../../tailwind.config.cjs";
import { clsx } from "clsx";

export function Button(props: {
	color: DesignSystemColors[number];
	className?: string;
	children: React.ReactNode;
}) {
	// props.className = clsx(styles[props.color], props.className);
	return <button {...props} />;
}

const base =
	"rounded-full bg-sky-300 py-2 px-4 text-sm font-semibold text-slate-900 hover:bg-sky-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300/50 active:bg-sky-500";

// const colors: Record<DesignSystemColors[number], string> = {};

// const styles: Record<DesignSystemColors[number], string> = {
// 	primary:
// 		"rounded-full bg-sky-300 py-2 px-4 text-sm font-semibold text-slate-900 hover:bg-sky-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300/50 active:bg-sky-500",
// 	secondary:
// 		"rounded-full bg-slate-800 py-2 px-4 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 active:text-slate-400",
// };
