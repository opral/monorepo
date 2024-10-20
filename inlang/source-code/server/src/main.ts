import express from "express";
import compression from "compression";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { router as rpcRouter } from "@inlang/rpc/router";
import { MarketplaceManifest } from "@inlang/marketplace-manifest";
import { ProjectSettings } from "@inlang/project-settings";
import { FileSchema } from "@inlang/plugin-message-format/file-schema";
import { createProxyMiddleware } from "http-proxy-middleware";

// --------------- SETUP -----------------

export const isProduction = process.env.NODE_ENV === "production";

const app = express();
// compress responses with gzip
app.use(compression());

// setup sentry error tracking
// must happen before the request handlers
if (isProduction) {
  Sentry.init({
    dsn: process.env.SERVER_SENTRY_DSN,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 0.1,
  });

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
}

// ----------------- ROUTES ----------------------

// used by sdk load test
app.get("/ping", (_, response) => {
  response.send(
    `http://localhost:3000 ${process.env.MOCK_TRANSLATE ? "MOCK_TRANSLATE" : ""}\n`,
  );
});

const serializedMarketplaceManifest = JSON.stringify(MarketplaceManifest);

app.get("/schema/marketplace-manifest", (_, response) => {
  response.header("Content-Type", "application/json");
  response.send(serializedMarketplaceManifest);
});

const serializedProjectSettings = JSON.stringify(ProjectSettings);

app.get("/schema/project-settings", (_, response) => {
  response.header("Content-Type", "application/json");
  response.send(serializedProjectSettings);
});

const serializedMessageStorageFormat = JSON.stringify(FileSchema);

app.get("/schema/inlang-message-format", (_, response) => {
  response.header("Content-Type", "application/json");
  response.send(serializedMessageStorageFormat);
});

app.use(rpcRouter);

app.use(
  "*",
  createProxyMiddleware({
    target: "http://localhost:4001",
    changeOrigin: true,
    headers: {
      Connection: "keep-alive",
    },
  }),
);

// ! website comes last in the routes because it uses the wildcard `*` to catch all routes

// ----------------- START SERVER -----------------

const port = 3000;
app.listen(port);
console.info(`Server running at http://localhost:${port}/`);

// log to sentry
if (isProduction) {
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());
}
