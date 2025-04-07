import { type RouteObject } from "react-router";
import Index from "./routes/index.tsx";
import About from "./routes/about/index.tsx";
import Graph from "./routes/graph/index.tsx";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/graph",
    element: <Graph />,
  },
];
