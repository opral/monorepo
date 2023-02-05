import { withCache } from "./with-cache.js";
import { withLint } from "./with-lint.js";
import type * as ast from "../ast/index.js";

function readResource(): ast.Resource {
  return {} as any;
}

const resource = withCache(withLint(readResource()));
