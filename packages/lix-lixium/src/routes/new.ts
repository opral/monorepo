import type { paths } from "@lix-js/server-protocol";
import type { LixiumRouter } from "../router.js";

export default function route(router: LixiumRouter): void {
	router.post("/lsp/new", async (c) => {
		const body = await c.req.blob();


    return 
    
    if (!body){
      return c.res.status.json({error: "Invalid Lix file format."});
      c.res.status.json({error: "Invalid Lix file format."});
    }


    try {

    }

	});
}
