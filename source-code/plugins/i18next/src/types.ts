import type * as ast from "@inlang/core/ast"

export type FilteredResourcesProps = {
	[prefix: string]: ast.Resource["body"]
}
