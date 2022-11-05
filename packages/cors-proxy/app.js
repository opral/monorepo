const express = require("express");
const corsProxy = require("@isomorphic-git/cors-proxy/middleware.js");
// const jose = require("jose");
// const { createSecretKey } = require("crypto");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;

// const secretKey = createSecretKey(process.env.JWT_SECRET_KEY, "base64");

app.use(corsProxy());

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// hacky proxy for authentification
// authorization: (req, res, next) => {
// 	if (req.path.includes("github") === false) {
// 		return res.status(500).send("Unsupported git hosting provider.");
// 	}
// 	// no auth headers -> continue with the request
// 	else if (req.headers.authorization === undefined) {
// 		return next();
// 	}
// 	const jwt = req.headers["authorization"].split(" ")[1];
// 	jose.jwtVerify(jwt, secretKey).then((decrypt) => {
// 		// the token seems to be in a wrong encoding.
// 		// therefore encode it as base64
// 		const formattedToken = Buffer.from(
// 			decrypt.payload.accessTokenJwt
// 		).toString("base64");
// 		req.headers["authorization"] = `Basic ${formattedToken}`;
// 		return next();
// 	});
// },
