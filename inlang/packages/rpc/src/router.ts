import express, { Router } from "express";
import bodyParser from "body-parser";
import { rpcHandler } from "typed-rpc/lib/express.js";
import { allRpcs } from "./functions/index.js";
import { route } from "./client.js";
import cors from "cors";
import { PUBLIC_ENV_VARIABLES } from "./services/env-variables/index.js";

export const router: Router = express.Router();

const allowedOrigins =
	PUBLIC_ENV_VARIABLES.PUBLIC_ALLOWED_AUTH_URLS?.split(",");

// Enable CORS for all allowed origins
router.use(
	route,
	cors({
		origin: allowedOrigins,
		methods: "GET,POST",
		credentials: true,
		optionsSuccessStatus: 204,
	})
);

// Some rpcs can be quite large
router.use(bodyParser.json({ limit: "50mb" }));

router.use(route, rpcHandler(allRpcs));
