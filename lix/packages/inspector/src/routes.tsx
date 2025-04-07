import { type RouteObject } from "react-router";
import Index from "./routes/index.tsx";
import Graph from "./routes/graph/index.tsx";
import DataExplorer from "./routes/data-explorer/index.tsx";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/graph",
    element: <Graph />,
  },
  {
    path: "/data-explorer",
    element: <DataExplorer />,
  },
];
