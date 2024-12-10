import { Separator } from "@/components/ui/separator.tsx"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import SectionHeader from "@/components/SectionHeader.tsx";
import IconMeatball from "@/components/icons/IconMeatball.tsx";
import IconFilter from "@/components/icons/IconFilter.tsx";
import AutomationConfig from "@/components/AutomationConfig.tsx";
import IconAutomation from "@/components/icons/IconAutomation.tsx";
import { useState } from "react";
import { cn } from "@/lib/utils.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";

const dummyAutomations = [
	{
		id: 0,
		name: "CSV update -> Send email",
		trigger: () => <>
			Change {" "}
			<span className="text-slate-500">* {" "}</span>
			<span className="text-slate-500 mx-1.5">{" "} in {" "}</span>
			<Badge variant="secondary">growth.csv</Badge>
		</>,
		condition: () => <>
			<span>Change</span>
			<span className="text-slate-500 mx-1.5">{" "} is {" "}</span>
			<span>tagged as "reviewed"</span>
		</>,
		action: () => <>
			<span>Email</span>
			<span className="text-slate-500 mx-1.5">{" "} to {" "}</span>
			<span>@Team</span>
		</>
	},
	{
		id: 1,
		name: "CSV number type check",
		trigger: () => <>
			Change {" "}
			<span className="text-slate-500">* {" "}</span>
			<span className="text-slate-500 mx-1.5">{" "} in {" "}</span>
			<Badge variant="secondary">finance.csv</Badge>
		</>,
		condition: () => <>
			<span>Change.value</span>
			<span className="text-slate-500">{" "} is not {" "}</span>
			<span>typeof "number"</span>
		</>,
		action: () => <>
			<span>Create validation report</span>
			<span className="text-slate-500">{" "} level = error {" "}</span>
		</>,
	},
];

export default function Page() {
	const [activeAutomation, setActiveAutomation] = useState<number>(0);

	return (
		<div className="flex bg-white">
			<div className="flex-1 flex flex-col">
				<SectionHeader title="Automations">
					<Button variant="secondary" disabled>
						Create
					</Button>
				</SectionHeader>
				{dummyAutomations.map((automation, index) => {
					return (
						<div key={index} onClick={() => setActiveAutomation(index)} className={cn(
							activeAutomation === automation.id ? "bg-slate-100" : "",
							"group flex items-center justify-between mx-2.5 h-12 px-2.5 py-3 rounded-md hover:bg-slate-50 cursor-pointer"
						)}>
							<div className="flex gap-3">
								<IconAutomation />
								{automation.name}
							</div>
						</div>
					);
				})}
				<div className="flex-grow">
					<div className="flex items-center justify-center h-full text-gray-400">
						Coming soon
					</div>
				</div>
			</div>
			<Separator orientation="vertical" className="h-screen" />
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
				<AutomationConfig trigger={dummyAutomations[activeAutomation!].trigger} condition={dummyAutomations[activeAutomation!].condition} action={dummyAutomations[activeAutomation!].action} />
				<Separator className="mt-4" />
				<div className="px-5 py-3 font-medium text-base flex justify-between items-center">Latest Runs
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
