import express, { type Express } from "express";
import { fileURLToPath } from "node:url";
import { router } from "./router.js";

export function createServer(): Express {
	const app = express();

	app.use(router);

	app.get("/health", (_req, res) => {
		res.status(200).json({ status: "ok" });
	});

	return app;
}

function startServer() {
	const app = createServer();
	const port = Number(process.env.PORT ?? "8787");
	const host = process.env.HOST ?? "0.0.0.0";

	app.listen(port, host, () => {
		// eslint-disable-next-line no-console
		console.log(`[rpc] listening on http://${host}:${port}`);
	});
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
	startServer();
}
