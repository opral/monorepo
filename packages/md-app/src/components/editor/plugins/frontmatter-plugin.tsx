import { createPlatePlugin } from "@udecode/plate-core/react";
import { PlateLeaf, PlateLeafProps } from "@udecode/plate/react";

export const FrontMatterElement = ({
	className,
	element,
	...props
}: PlateLeafProps) => {
  return (
		<PlateLeaf asChild className={className} {...props}>
			<code>{element.value}</code>
		</PlateLeaf>
	);
};

export const FrontMatterPlugin = createPlatePlugin({
	key: "frontmatter",
	node: {
		component: FrontMatterElement,
		isElement: true,
		isVoid: true,
	},
});
