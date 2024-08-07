import { Link } from "react-router-dom";
import clsx from "clsx";
import { pendingChangesAtom } from "../state.ts";
import { useAtom } from "jotai";

const data: { path: string; name: string }[] = [
	{
		path: "/",
		name: "Edit",
	},
	{
		path: "/changes",
		name: "Changes",
	},
];

const ModeSwitcher = () => {
	const [pendingChanges] = useAtom(pendingChangesAtom);

	return (
		<div className="h-[34px] px-[2px] flex items-center bg-zinc-100 rounded">
			{data.map((item) => (
				<SwitcherButton
					key={item.path}
					path={item.path}
					name={item.name}
					numUncommittedChanges={pendingChanges.length}
				/>
			))}
		</div>
	);
};

export default ModeSwitcher;

const SwitcherButton = (props: {
	path: string;
	name: string;
	numUncommittedChanges: number;
}) => {
	return (
		<Link key={props.path} to={props.path}>
			<div
				className={clsx(
					"h-8 items-center px-4 flex text-xs! box-border",
					window && window.location.pathname === props.path
						? "bg-white border border-zinc-300 rounded"
						: ""
				)}
			>
				{props.name}
				{props.path === "/changes" && (
					<div className="ml-2 text-xs! text-zinc-700 bg-zinc-300 h-5 rounded flex items-center px-2 font-medium -mr-1">
						{props.numUncommittedChanges}
					</div>
				)}
			</div>
		</Link>
	);
};
