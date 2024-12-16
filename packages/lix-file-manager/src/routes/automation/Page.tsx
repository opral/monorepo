import { Separator } from "@/components/ui/separator.tsx"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import SectionHeader from "@/components/SectionHeader.tsx";
import IconMeatball from "@/components/icons/IconMeatball.tsx";
import IconFilter from "@/components/icons/IconFilter.tsx";
import AutomationConfig from "@/components/AutomationConfig.tsx";
import IconAutomation from "@/components/icons/IconAutomation.tsx";
import { useState } from "react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { clsx } from "clsx";

const dummyAutomations = [
	{
		id: 0,
		name: "CSV update -> Send email",
		trigger: () => (
			<>
				Change <span className="text-slate-500">* </span>
				<span className="text-slate-500 mx-1.5"> in </span>
				<Badge variant="secondary">growth.csv</Badge>
			</>
		),
		condition: () => (
			<>
				<span>Change</span>
				<span className="text-slate-500 mx-1.5"> is </span>
				<span>tagged as "reviewed"</span>
			</>
		),
		action: () => (
			<>
				<span>Email</span>
				<span className="text-slate-500 mx-1.5"> to </span>
				<span>@Team</span>
			</>
		),
	},
	{
		id: 1,
		name: "CSV number type check",
		trigger: () => (
			<>
				Change <span className="text-slate-500">* </span>
				<span className="text-slate-500 mx-1.5"> in </span>
				<Badge variant="secondary">finance.csv</Badge>
			</>
		),
		condition: () => (
			<>
				<span>Change.value</span>
				<span className="text-slate-500"> is not </span>
				<span>typeof "number"</span>
			</>
		),
		action: () => (
			<>
				<span>Create validation report</span>
				<span className="text-slate-500"> level = error </span>
			</>
		),
	},
];

export default function Page() {
	const [activeAutomation, setActiveAutomation] = useState<number>(0);

	return (
		<div className="flex bg-white">
			<div
				className="min-w-[300px] max-w-[600px] w-[340px] flex flex-col relative"
				ref={(el) => {
					if (el) {
						el.style.width = el.offsetWidth + "px";
					}
				}}
			>
				<SectionHeader title="Automations">
					<Button variant="secondary" disabled>
						Create
					</Button>
				</SectionHeader>
				<div className="flex flex-col gap-2 mt-1.5">
					{dummyAutomations.map((automation, index) => {
						return (
							<div
								key={index}
								onClick={() => setActiveAutomation(index)}
								className={clsx(
									"group flex items-center mx-2 h-9 px-2 hover:bg-slate-50 cursor-pointer rounded-md",
									activeAutomation === automation.id
										? "bg-slate-100 hover:bg-slate-100"
										: ""
								)}
							>
								<div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-500">
									<IconAutomation />
								</div>
								<div className="min-w-0 flex-1 ml-2">
									<p className="text-md truncate" title={automation.name}>
										{automation.name}
									</p>
								</div>
								<div
									className={clsx(
										"flex opacity-0 transition-opacity group-hover:opacity-100"
									)}
								>
									<Button variant="ghost" size="icon">
										<IconMeatball />
									</Button>
								</div>
							</div>
						);
					})}
				</div>
				<div className="flex-grow">
					<div className="flex items-center justify-center h-full text-gray-400">
						Coming soon
					</div>
				</div>
				<div
					className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-slate-300 group"
					onMouseDown={(e) => {
						e.preventDefault();
						const container = e.currentTarget.parentElement;
						if (!container) return;

						const startX = e.clientX;
						const startWidth = container.offsetWidth;

						const handleMouseMove = (moveEvent: MouseEvent) => {
							const delta = moveEvent.clientX - startX;
							const newWidth = Math.min(Math.max(startWidth + delta, 300), 600);
							if (container) {
								container.style.width = `${newWidth}px`;
							}
						};

						const handleMouseUp = () => {
							document.removeEventListener("mousemove", handleMouseMove);
							document.removeEventListener("mouseup", handleMouseUp);
							document.body.style.cursor = "";
						};

						document.addEventListener("mousemove", handleMouseMove);
						document.addEventListener("mouseup", handleMouseUp);
						document.body.style.cursor = "col-resize";
					}}
				>
					<div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-200 opacity-0 group-hover:opacity-100" />
				</div>
			</div>
			<Separator orientation="vertical" className="h-[calc(100vh_-_36px)]" />
			<div className="flex-1 flex flex-col">
				<SectionHeader title={dummyAutomations[activeAutomation].name}>
					<div className="flex gap-2 items-center">
						<Tabs defaultValue="disabled">
							<TabsList>
								<TabsTrigger value="running">running</TabsTrigger>
								<TabsTrigger value="disabled">disabled</TabsTrigger>
							</TabsList>
						</Tabs>
						<Button variant="secondary" size="icon">
							<IconMeatball />
						</Button>
					</div>
				</SectionHeader>
				<div className="p-5 font-medium text-base">Configuration</div>
				<AutomationConfig
					trigger={dummyAutomations[activeAutomation!].trigger}
					condition={dummyAutomations[activeAutomation!].condition}
					action={dummyAutomations[activeAutomation!].action}
				/>
				<Separator className="mt-4" />
				<div className="px-5 py-3 font-medium text-base flex justify-between items-center">
					Latest Runs
					<Button variant="ghost" size="icon" className="text-slate-500">
						<IconFilter />
					</Button>
				</div>
				<div className="flex items-center px-5 py-2.5 text-slate-500">
					<div>No runs yet</div>
				</div>
			</div>
		</div>
	);
}
