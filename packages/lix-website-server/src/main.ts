import express from "express";
import { createRequestHandler } from "@remix-run/express";
import { fileURLToPath } from "url";
import fs from "fs";
import { dirname, join } from "path";
import { createRequire } from "module";
import cors from "cors";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { convertToCoreMessages, generateText, streamText } from "ai";
import dotenv from "dotenv";

dotenv.config();
const require = createRequire(import.meta.url);

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const node_modules = join(__dirname, "../node_modules");

const app = express();
app.use(express.json());

// CORS Configuration
const allowedOrigins = ["https://lix.opral.com", "https://lix-md.onrender.com"];

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:3005", "http://localhost:3009");
}

interface CorsOptions {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => void;
  credentials: boolean;
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// AI Command Streaming Endpoint
// @ts-expect-error - overload type error
app.post("/api/ai/command", async (req, res) => {
  const { messages, model = "gpt-4", system } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(401).json({ error: "Missing OpenAI API key." });
  }

  // Real AI response if API key is available
  const openai = createOpenAI({ apiKey });

  try {
    const result = streamText({
      maxTokens: 2048,
      messages: convertToCoreMessages(messages),
      model: openai(model),
      system,
    });

    result.pipeTextStreamToResponse(res);
  } catch (error) {
    console.error("AI Command Error:", error);
    res.status(500).json({ error: "Failed to process AI request" });
  }
});

// AI Copilot Endpoint
// @ts-expect-error - overload type error
app.post("/api/ai/copilot", async (req, res) => {
  try {
    const { model = "gpt-4", prompt, system } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ error: "Missing OpenAI API key." });
    }

    const result = await generateText({
      // abortSignal: req.signal,
      maxTokens: 50,
      model: openai(model),
      prompt,
      system,
      temperature: 0.7,
    });
    res.json(result);
  } catch (error) {
    console.error("AI Copilot Error:", error);
    res.status(500).json({ error: "Failed to process AI request" });
  }
});

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
  {
    route: "flashtype",
    module: "md-app",
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
}


// Start the server
const port = 3005;
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
