import { RouteObject } from "react-router-dom";
import EditorPage from "./routes/editor/Page.tsx";
import IndexPage from "./routes/index/Page.tsx";
import HistoryPage from "./routes/history/Page.tsx";
import RootLayout from "./layouts/RootLayout.tsx";

export const routes: RouteObject[] = [
	{
		path: "/",
		element: (
			<RootLayout>
				<IndexPage />
			</RootLayout>
		),
	},
	{
		path: "/editor",
		element: (
			<RootLayout>
				<EditorPage />
			</RootLayout>
		),
	},
	{
		path: "/history",
		element: (
			// @ts-expect-error - type mismatch?
			<RootLayout>
				<HistoryPage />,
			</RootLayout>
		),
	},
];
