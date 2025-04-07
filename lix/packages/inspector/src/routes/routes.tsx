import { type RouteObject } from "react-router";
import Index from "./index.tsx";
import About from "./about/index.tsx";
import Graph from "./graph/index.tsx";

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
