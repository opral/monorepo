import { Show, type JSXElement } from "solid-js";
import { Arrow } from "../Personas/Developer.jsx";
import Link from "#src/renderer/Link.jsx";

interface LixCardProps {
	title: string;
	description: string;
	icon: JSXElement;
	imagePath?: string;
	link: string;
}

const LixCard = (props: LixCardProps) => {
	return (
		<Link href={props.link}>
			<div class="bg-background rounded-2xl border border-surface-200 py-5 px-6 hover:border-surface-400 transition-all cursor-pointer">
				<div class="flex justify-between items-center pb-4">
					<div class="w-10 h-10 rounded-lg bg-surface-100 text-surface-700 flex justify-center items-center">
						{props.icon}
					</div>
					<div class="w-8 h-8 border border-surface-300 rounded-full flex justify-center items-center group-hover:bg-surface-100 transition-all text-surface-500 group-hover:text-surface-900">
						<Arrow />
					</div>
				</div>
				<Show when={props.imagePath}>
					<img
						class="rounded-lg w-full h-[200px] object-contain object-center"
						src={props.imagePath}
						alt={props.title}
					/>
				</Show>
				<div class="flex flex-col gap-2 pb-2 max-w-xs pt-6">
					<div class="text-lg font-bold text-surface-600">{props.title}</div>
					<div class="line-clamp-2 text-surface-500">{props.description}</div>
				</div>
			</div>
		</Link>
	);
};

export default LixCard;
