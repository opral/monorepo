import { Link } from "react-router-dom";
import clsx from "clsx";
import { conflictsAtom, pendingChangesAtom } from "../state.ts";
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
	{ path: "/conflicts", name: "Conflicts" },
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
	const [conflicts] = useAtom(conflictsAtom);

	return (
		<Link key={props.path} to={props.path}>
			<div
				className={clsx(
					"h-8 items-center px-4 flex text-xs! border rounded box-border",
					window && window.location.pathname === props.path
						? "bg-white border-zinc-300"
						: "border-transparent"
				)}
			>
				{props.name}
				{props.path === "/changes" && (
					<div
						className={clsx(
							"ml-2 text-xs!  h-5 rounded flex items-center px-2 font-medium -mr-1",
							props.numUncommittedChanges === 0
								? "text-zinc-700 bg-zinc-300"
								: "text-blue-700 bg-blue-200"
						)}
					>
						{props.numUncommittedChanges}
					</div>
				)}
				{props.path === "/conflicts" && (
					<div
						className={clsx(
							"ml-2 text-xs!  h-5 rounded flex items-center px-2 font-medium -mr-1",
							conflicts.length === 0
								? "text-zinc-700 bg-zinc-300"
								: "text-blue-700 bg-blue-200"
						)}
					>
						{conflicts.length}
					</div>
				)}
			</div>
		</Link>
	);
};
