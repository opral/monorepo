import { handleRpc } from "typed-rpc/lib/server.js";
import { allRpcs } from "./functions/index.js";
import { PUBLIC_ENV_VARIABLES } from "./services/env-variables/index.js";

export { allRpcs };
export { PUBLIC_ENV_VARIABLES };

export async function handleRpcRequest(body: unknown) {
	return handleRpc(body as Parameters<typeof handleRpc>[0], allRpcs);
}
