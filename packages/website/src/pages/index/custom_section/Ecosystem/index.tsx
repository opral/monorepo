import {
	AppIcon,
	LibraryIcon,
	LintRuleIcon,
	PluginIcon,
} from "#src/pages/documentation/icons/TinyIcons.jsx";
import Link from "#src/renderer/Link.jsx";
import { type JSXElement } from "solid-js";
import { Arrow } from "../Personas/Developer.jsx";
import InlangIconBig from "./inlangLogoBig.jsx";

const EcosystemComponents = () => {
	return (
		<div class="pt-12 md:pt-20 flex flex-col items-center">
			<p class="bg-background px-4 py-1.5 rounded-full text-sm font-medium w-fit border shadow border-surface-300">
				Plug and Play
			</p>
			<h2 class="font-bold text-2xl md:text-4xl text-surface-900 text-center mt-5">
				Ecosystem Components
			</h2>
			<p class="text-center text-lg max-w-[500px] text-surface-500 pt-5">
				Plug inlang’s products together to tap into new markets and gain a
				larger customer base.
			</p>
			<div class="relative h-[140px] w-full mt-8">
				<div class="absolute top-[45%] left-0 w-full h-[55%] flex justify-center items-center">
					<div class="w-[75vw] xl:w-[950px] h-full rounded-2xl overflow-hidden bg-gradient-to-b from-surface-300 px-px pt-px">
						<div class="w-full h-full bg-surface-50 rounded-[15px]" />
					</div>
				</div>
				<div class="absolute top-[55%] left-0 w-full h-[45%] flex justify-center items-center">
					<div class="sm:w-[30vw] xl:w-[350px] h-full rounded-2xl overflow-hidden bg-gradient-to-b from-surface-300 px-px pt-px">
						<div class="w-full h-full bg-surface-50 rounded-[15px]" />
					</div>
				</div>
				<div class="absolute top-0 left-0 w-full h-full flex justify-center items-center">
					<div class="w-28 h-28 rounded-3xl overflow-hidden border border-surface-200 bg-background" />
				</div>
				<div class="absolute top-0 left-0 w-full h-full flex justify-center items-center">
					<div class="w-20 h-20 rounded-2xl overflow-hidden border border-surface-50 shadow-2xl">
						<InlangIconBig />
					</div>
				</div>
			</div>
			<div class="flex flex-col md:flex-row mt-10 w-full gap-4">
				<Card
					title="Apps"
					description="Superpower your i18n experience with globalization apps."
					href="/c/apps"
					icon={<AppIcon />}
				/>
				<Seperator />
				<Card
					title="Libraries"
					description="Use Libraries to extend your software project."
					href="/c/libraries"
					icon={<LibraryIcon />}
				/>
				<Seperator />
				<Card
					title="Plugins"
					description="Change or extend app behavior."
					href="/c/plugins"
					icon={<PluginIcon />}
				/>
				<Seperator />
				<Card
					title="Lint Rules"
					description="Validate content in an inlang project."
					href="/c/lint-rules"
					icon={<LintRuleIcon />}
				/>
			</div>
		</div>
	);
};

export default EcosystemComponents;

const Seperator = () => {
	return (
		<div class="h-px md:h-auto md:self-stretch w-full md:w-px border-t-[2px] md:border-r-[2px] border-surface-200 border-dashed md:my-4" />
	);
};

const Card = (props: {
	title: string;
	description: string;
	href: string;
	icon: JSXElement;
}) => {
	return (
		<Link
			class="flex-1 p-4 bg-background/0 hover:bg-background cursor-pointer flex flex-col gap-4 rounded-xl transition-all"
			href={props.href}
		>
			<div class="flex items-center gap-4">
				<div class="w-5 h-5 text-surface-500">{props.icon}</div>
				<h3 class="flex-1 text font-semibold text-surface-700">
					{props.title}
				</h3>
				<div class="opacity-30">
					<Arrow />
				</div>
			</div>
			<p class="text-surface-500 text-sm pr-8 leading-relaxed">
				{props.description}
			</p>
		</Link>
	);
};
