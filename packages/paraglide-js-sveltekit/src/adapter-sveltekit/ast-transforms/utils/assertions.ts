import { Node } from "ts-morph"
import type { VirtualModule } from "../../vite-plugin/config/index.js"
import { InlangSdkException } from "../../vite-plugin/exceptions.js"
import { filePathForOutput } from "../../vite-plugin/fileInformation.js"

export const assertNodeInsideFunctionScope = (
	config: VirtualModule,
	filePath: string,
	node: Node,
) => {
	let nodeToCheck: Node | undefined = node.getParent()

	while (nodeToCheck) {
		if (Node.isFunctionLikeDeclaration(nodeToCheck)) return
		nodeToCheck = nodeToCheck.getParent()
	}

	throw new InlangSdkException(`You cannot directly access any '@inlang/paraglide-js-sveltekit' imports in outside a function scope in this file (${filePathForOutput(
		config,
		filePath,
	)}).
Please read the docs for more information on how to workaround this limitation:
https://inlang.com/documentation/sdk/sveltekit/advanced#*.js`)
}
