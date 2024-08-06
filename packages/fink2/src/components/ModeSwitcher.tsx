import { Link } from "react-router-dom";
import clsx from "clsx";
import { projectAtom } from "../state.ts";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";

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
	const [project] = useAtom(projectAtom);
	const [numUncommittedChanges, setNumUncommittedChanges] = useState(0);

	const calculateNumUncommittedChanges = async () => {
		const uncommittedChanges = await project?.lix.db
			.selectFrom("change")
			.selectAll()
			.where("commit_id", "is", null)
			.execute();

		if (uncommittedChanges) {
			setNumUncommittedChanges(uncommittedChanges.length);
		}
	};

	useEffect(() => {
		calculateNumUncommittedChanges();
		setInterval(async () => {
			calculateNumUncommittedChanges();
		}, 1500);
	});

	return (
		<div className="h-[34px] px-[2px] flex items-center bg-zinc-100 rounded">
			{data.map((item) => (
				<SwitcherButton
					key={item.path}
					path={item.path}
					name={item.name}
					numUncommittedChanges={numUncommittedChanges}
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
