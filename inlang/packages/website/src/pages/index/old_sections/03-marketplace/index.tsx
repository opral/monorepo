import { For } from "solid-js";
import type { JSX } from "solid-js";
import { Button } from "../../components/Button.jsx";
import { SectionLayout } from "../../components/sectionLayout.jsx";
import App from "./assets/categories/app.jsx";
import Payments from "./assets/categories/payments.jsx";
import Documents from "./assets/categories/documents.jsx";
import Website from "./assets/categories/website.jsx";

type CardType = {
	title: string;
	description: string;
	soon: boolean;
	button: string;
	link: string;
	img: JSX.Element;
	left: boolean;
	color: string;
};

const data: CardType[] = [
	{
		title: "Global App",
		description:
			"Globalize your application and get a process that suits your needs.",
		soon: false,
		button: "Start your Global App",
		link: "/apps",
		img: <App />,
		left: true,
		color: "#06B6D4",
	},
	{
		title: "Global Payment",
		description:
			"Enable your customers to pay with ease using their favorite method.",
		soon: true,
		button: "Start Global Payment",
		link: "/payment",
		img: <Payments />,
		left: false,
		color: "#63DE59",
	},
	{
		title: "Global Documents",
		description:
			"Documents made to collaborate with version control and multi-language support.",
		soon: true,
		button: "Start with Global Documents",
		link: "/document",
		img: <Documents />,
		left: true,
		color: "#06B6D4",
	},
	{
		title: "Global Email",
		description: "Stay in touch with your customers in their native language.",
		soon: true,
		button: "Start a Global Email Campaign",
		link: "/email",
		img: <img src="./images/email.png" alt="Email" />,
		left: false,
		color: "#06B6D4",
	},
	{
		title: "Global Website",
		description: "Let your website speak the language of your customers.",
		soon: true,
		button: "Start your Global Website",
		link: "/website",
		img: <Website />,
		left: true,
		color: "#06B6D4",
	},
];

const Marketplace = () => {
	return (
		<div id="categories">
			<SectionLayout showLines={true} type="lightGrey">
				<div>
					<div class="relative w-full flex justify-center overflow-hidden -mb-6">
						<img
							src="/images/landingpage/marketplace_apps.png"
							class="w-[180%] lg:w-full max-w-5xl mx-auto"
						/>
						<div class="absolute inset-0 z-10 bg-gradient-to-t from-surface-100/0 via-surface-100/0 via-70% to-surface-100/70 mix-blend-lighten" />
					</div>
					<div class="flex flex-col items-center px-6">
						<h1 class="text-center md:pb-6 text-[40px] leading-tight md:text-6xl md:text-center font-bold text-surface-800 tracking-tight">
							Choose where to start
						</h1>
						<p class="text-surface-600 text-center md:text-xl text-xl md:max-w-[500px] md:text-center pt-2">
							Choose a category to get to the building blocks of your
							globalization strategy.
						</p>
					</div>
				</div>
				<div class="w-full flex flex-col lg:flex-row gap-8 py-16 px-6 lg:px-4">
					<div class="w-full lg:w-1/2 flex flex-col gap-8">
						<For each={data.filter((card) => card.left === true)}>
							{(card) => {
								return (
									<div class="relative col-span-2 bg-background shadow-lg rounded-[18px] p-2 group lg:h-[390px]">
										<div class="relative bg-surface-100 rounded-[14px] h-36 lg:h-56 lg:group-hover:h-44 transition-all duration-800 ease-in-out overflow-hidden">
											<div class="z-20 relative translate-y-0 lg:group-hover:-translate-y-4 transition duration-800 ease-in-out">
												{card.img}
											</div>
											<div
												class={
													"z-10 absolute w-1/2 h-1/2 bg-[" +
													card.color +
													"] top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 blur-2xl opacity-5 group-hover:opacity-20 transition-all duration-400"
												}
											/>
										</div>
										<div class="p-6 flex flex-col gap-4">
											{/* <p
												class={
													(!card.soon
														? "bg-[#D7F3F8] text-primary"
														: "bg-surface-100 text-surface-500") +
													" px-3 py-2 w-fit rounded-md text-sm"
												}
											>
												{card.soon ? "planned" : "try now"}
											</p> */}
											<h3 class="text-3xl font-semibold text-surafce-900">
												{card.title}
											</h3>
											<p class="w-full lg:w-[80%] text-surafce-800 text-lg">
												{card.description}
											</p>
											<div class="w-full h-auto lg:h-0 lg:opacity-0 group-hover:opacity-100 transition duration-800">
												<Button type="textPrimary" href={card.link} chevron>
													<p class="text-[16px]">{card.button}</p>
												</Button>
											</div>
										</div>
									</div>
								);
							}}
						</For>
					</div>
					<div class="w-full lg:w-1/2 flex flex-col gap-8 lg:pt-32">
						<For each={data.filter((card) => card.left === false)}>
							{(card) => {
								return (
									<div class="relative col-span-2 bg-background shadow-lg rounded-[18px] p-2 group lg:h-[390px]">
										<div class="relative bg-surface-100 rounded-[14px] lg:h-56 h-36 lg:group-hover:h-44 transition-all duration-800 ease-in-out overflow-hidden">
											<div class="z-20 relative translate-y-0 lg:group-hover:-translate-y-4 transition duration-800 ease-in-out">
												{card.img}
											</div>
											<div
												class={
													"z-10 absolute w-1/2 h-1/2 bg-[" +
													card.color +
													"] top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 blur-2xl opacity-5 lg:group-hover:opacity-20 transition-all duration-400"
												}
											/>
										</div>
										<div class="p-6 flex flex-col gap-4">
											{/* <p
												class={
													(!card.soon
														? "bg-[#D7F3F8] text-primary"
														: "bg-surface-100 text-surface-500") +
													" px-3 py-2 w-fit rounded-md text-sm"
												}
											>
												{card.soon ? "planned" : "try now"}
											</p> */}
											<h3 class="text-3xl font-semibold text-surafce-900">
												{card.title}
											</h3>
											<p class="w-full lg:w-[80%] text-surafce-800 text-lg">
												{card.description}
											</p>
											<div class="w-full h-auto lg:h-0 lg:opacity-0 group-hover:opacity-100 transition duration-800">
												<Button type="textPrimary" href={card.link} chevron>
													<p class="text-[16px]">{card.button}</p>
												</Button>
											</div>
										</div>
									</div>
								);
							}}
						</For>
					</div>
				</div>
			</SectionLayout>
		</div>
	);
};

export default Marketplace;
