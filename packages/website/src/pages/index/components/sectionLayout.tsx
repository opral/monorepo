import type { JSXElement } from "solid-js";

const landingpageGrid = "max-w-screen-xl w-full mx-auto";
type sectionType = "white" | "lightGrey" | "blue" | "dark";

interface SectionLayoutProps {
  children: JSXElement;
  type: sectionType;
  showLines: boolean;
}

export const SectionLayout = (props: SectionLayoutProps) => {
  return (
    <div class={"w-full"}>
      <div class={"relative " + landingpageGrid}>{props.children}</div>
    </div>
  );
};
