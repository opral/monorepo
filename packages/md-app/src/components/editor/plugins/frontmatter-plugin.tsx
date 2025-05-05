import { createPlatePlugin } from "@udecode/plate-core/react";
import { PlateLeaf, PlateLeafProps } from "@udecode/plate/react";

export const FrontMatterElement = ({
	className,
	// @ts-expect-error -- the type seem to wrong
	element,
	...props
}: PlateLeafProps) => {
  return (
		<PlateLeaf className={className} {...props} attributes={{
			...props.attributes,
			asChild: true,
		}}>
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
