import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

// --------------- SETUP -----------------

export const isProduction = process.env.NODE_ENV === "production";

const app = express();

// ----------------- ROUTES ----------------------

app.use(
  "*",
  createProxyMiddleware({
    target: "https://eu.posthog.com",
    changeOrigin: true,
    onProxyReq: (req) => {
      req.path;
    },
    onProxyRes: (proxyRes) => {
      proxyRes.headers["Access-Control-Allow-Origin"] = "null";
    },
  }),
);

// ----------------- START SERVER -----------------

const port = 4006;
app.listen(port);
console.info(`Server running at http://localhost:${port}/`);
