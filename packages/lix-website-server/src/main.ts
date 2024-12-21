import express from "express";
import { createRequestHandler } from "@remix-run/express";
import { fileURLToPath } from "url";
import fs from "fs";
import { dirname, join } from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const node_modules = join(__dirname, "../node_modules");

const app = express();

// Middleware to forward browser fetch requests to the correct subpath
app.use((req, res, next) => {
  // Skip for /file-manager
  if (req.url?.startsWith("/file-manager") || req.url === "/") {
    return next();
  }

  if (req.headers.referer === undefined) {
    return next();
  }

  const refererPath = new URL(req.headers.referer).pathname;
  const isAppReferer = refererPath?.startsWith("/app");
  if (!isAppReferer) {
    return next();
  }

  const refererAppName = isAppReferer ? refererPath.split("/")[2] : null;

  // Exception for cross-app navigation
  if (req.url?.startsWith("/app") && refererAppName !== req.url.split("/")[2]) {
    console.log("Cross-app navigation detected");
    return next();
  }

  if (
    refererPath?.startsWith(`/app/${refererAppName}`) &&
    !req.url.startsWith(`/app/${refererAppName}`)
  ) {
    req.url = `/app/${refererAppName}` + req.url.replace(/\/$/, "");
  }

  return next();
});

// Serve pre-built Lix apps
const lixApps = [
  {
    route: "fm",
    module: "lix-file-manager",
  },
  {
    route: "csv",
    module: "csv-app",
  },
];

for (const lixApp of lixApps) {
  app.use(
    `/app/${lixApp.route}`,
    express.static(`${node_modules}/${lixApp.module}/dist`),
  );
  app.get(`/app/${lixApp.route}/*`, (req, res) => {
    const indexPath = join(node_modules, `${lixApp.module}/dist/index.html`);
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("File not found");
    }
  });
}

// Serve static files from client
app.use(express.static(`${node_modules}/lix-website/build/client`));

// Serve the website server routes
app.all(
  "*",
  // @ts-ignore
  createRequestHandler({
    build: require(`${node_modules}/lix-website/build/server`),
  })
);

// Start the server
const port = 3005;
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
