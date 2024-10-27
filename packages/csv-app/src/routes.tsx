import { RouteObject } from "react-router-dom";
import EditorPage from "./routes/editor/Page.tsx";
import IndexPage from "./routes/index/Page.tsx";
import GraphPage from "./routes/graph/Page.tsx";
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
		path: "/graph",
		element: (
			// @ts-expect-error - type mismatch?
			<RootLayout>
				<GraphPage />,
			</RootLayout>
		),
	},
];
