import { type RouteObject } from "react-router";
import Index from "./routes/index.tsx";
import Graph from "./routes/graph/index.tsx";
import DataExplorer from "./routes/data-explorer/index.tsx";
import Layout from "./routes/layout.tsx";

export const routes: RouteObject[] = [
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: Index,
      },
      {
        path: "graph",
        Component: Graph,
      },
      {
        path: "data-explorer",
        Component: DataExplorer,
      },
    ],
  },
];
