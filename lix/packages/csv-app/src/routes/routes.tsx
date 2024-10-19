import { RouteObject } from "react-router-dom";
import EditorPage from "./editor/Page.tsx";
import IndexPage from "./index/Page.tsx";
import HistoryPage from "./history/Page.tsx";

export const routes: RouteObject[] = [
	{
		path: "/",
		element: <IndexPage />,
	},
	{
		path: "/editor",
		element: <EditorPage />,
	},
	{
		path: "/history",
		element: <HistoryPage />,
	},
];
