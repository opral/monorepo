import express from "express";
import { fileURLToPath } from "url";
import fs from "fs";
import { dirname, join } from "path";
// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const node_modules = join(__dirname, "../node_modules");
const app = express();
// forward browser fetch requests to correct subpath
// user is on site /app/fm -> app requests /asset/xyz.js -> /app/fm/asset/xyz.js
// user is on site /app/csv -> app requests /asset/xyz.js -> /app/csv/asset/xyz.js
app.use((req, res, next) => {
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
    express.static(`${node_modules}/${lixApp.module}/dist`)
  );
  app.get(`/app/${lixApp.route}/*`, (req, res) => {
    const indexPath = join(node_modules, `${lixApp.module}/dist/index.html`);
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("File not found");
    }
  });
};

// Fallback route for undefined routes
app.get("*", (req, res) => {
  res.status(404).send("File not found");
});
const port = 3000;
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
