import { Button } from "@/components/ui/button.tsx";
import ListItems from "./../../components/ListItems.tsx";
import SectionHeader from "./../../components/SectionHeader.tsx";
import { Separator } from "./../../../components/ui/separator.tsx"
import { Link } from "react-router-dom";
import IconMeatball from "./../../components/icons/IconMeatball.tsx";
import IconFilter from "./../../components/icons/IconFilter.tsx";

const dummyAutomations = [
	{
		name: "CSV update -> Send email",
		trigger: "policy.md",
		condition: `tagged as "reviewed"`,
		action: "Email to @Team",
	},
	{
		name: "CSV number type check",
		trigger: "finance.csv",
		condition: `Change.value is not typeof "number"`,
		action: "Create validation report level = error",
	},
];

export default function Page() {
	return (
		<div className="flex bg-white">
			<div className="flex-1 flex flex-col">
				<SectionHeader title="Automations">
					<Button variant="secondary" disabled>
						Create
					</Button>
				</SectionHeader>
				{dummyAutomations.map((automation) => {
					return (
						<ListItems
							key={automation.name}
							id={automation.name}
							type="automation"
							name={automation.name}
						/>
					);
				})}
				<Link to="/automation" className="flex-grow">
					<div className="flex items-center justify-center h-full text-gray-400">
						Coming soon
					</div>
				</Link>
			</div>
			<Separator orientation="vertical" className="h-screen" />
			<div className="flex-1 flex flex-col">
				<SectionHeader title="Automations">
					<Button variant="secondary" size="icon">
						<IconMeatball />
					</Button>
				</SectionHeader>
				<div className="p-5 font-medium text-base">Configuration</div>
				<Separator />
				<div className="px-5 py-3 font-medium text-base flex justify-between items-center">Latest Runs
					<Button variant="ghost" size="icon">
						<IconFilter />
					</Button>
				</div>
				{/* no run yet */}
				<div className="flex items-center px-5 py-2.5 text-gray-400">
					<div>No runs yet</div>
				</div>
			</div>
		</div>
	);
}
