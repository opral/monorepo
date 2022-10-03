import { Config } from "@stencil/core";

export const config: Config = {
	namespace: "inlang-components",
	srcDir: "src/components",
	outputTargets: [{ type: "dist", dir: "./dist/components" }],
};
