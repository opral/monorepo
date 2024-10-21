import { Link } from "react-router-dom";
import clsx from "clsx";
import { pendingChangesAtom } from "../state.ts";
import { useAtom } from "jotai";

const data: { path: string; name: string }[] = [
	{
		path: "/editor",
		name: "Data",
	},
	{
		path: "/history",
		name: "History",
	},
];

const SubNavigation = () => {
	const [pendingChanges] = useAtom(pendingChangesAtom);
	// const [commits] = useAtom(commitsAtom);
	const commits = [];

	return (
		<div className="flex px-[2px] gap-3 items-center -mb-[1px] -ml-[3px]">
			{data.map((item) => {
				if (item.path === "/history" && commits.length > 0) {
					return (
						<NavItem
							key={item.path}
							path={item.path}
							name={item.name}
							numUncommittedChanges={pendingChanges.length}
						/>
					);
				} else if (item.path === "/editor") {
					return (
						<NavItem
							key={item.path}
							path={item.path}
							name={item.name}
							numUncommittedChanges={pendingChanges.length}
						/>
					);
				}
			})}
		</div>
	);
};

export default SubNavigation;

const NavItem = (props: {
	path: string;
	name: string;
	numUncommittedChanges: number;
}) => {
	return (
		<Link key={props.path} to={props.path} className={clsx("pb-1 relative")}>
			<div
				className={clsx(
					"h-8 items-center px-2 flex text-[15px]! font-medium box-border text-zinc-500 hover:bg-zinc-100 rounded",
					window && window.location.pathname === props.path
						? "text-zinc-950"
						: ""
				)}
			>
				{props.name}
			</div>
			<div
				className={clsx(
					"w-[calc(100%_-_8px)] mx-[4px] h-[2px] bottom-0 right-0 absolute",
					window && window.location.pathname === props.path
						? "bg-zinc-950"
						: "bg-transparent"
				)}
			></div>
		</Link>
	);
};
