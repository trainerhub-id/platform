import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import yazl from "yazl";
import { packDocxMasterDocument } from "./master/docx-master-document.factory.mjs";
import { packDocxTrainerDocument, TRAINER_DOCUMENT_TYPES } from "./trainer/docx-trainer-document.factory.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const docxDir = path.join(rootDir, "docx");
const pptxDir = path.join(rootDir, "pptx");
const docxOutputDir = path.join(docxDir, "generated-js");
const pptxOutputPath = path.join(pptxDir, "output-sdm-js.pptx");

const app = new Hono();

app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors());
app.use("*", bodyLimit({ maxSize: 1024 * 32 }));

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn(command, args, { cwd, shell: false });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      const durationMs = Date.now() - startedAt;
      if (code === 0) {
        resolve({ code, stdout, stderr, durationMs });
        return;
      }
      const error = new Error(`${command} ${args.join(" ")} failed with exit code ${code}`);
      error.code = code;
      error.stdout = stdout;
      error.stderr = stderr;
      error.durationMs = durationMs;
      reject(error);
    });
  });
}

function listFiles(dir, extension) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(extension))
    .map((entry) => {
      const filePath = path.join(dir, entry.name);
      const stat = fs.statSync(filePath);
      return {
        name: entry.name,
        size: stat.size,
        updatedAt: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

function assertSafeName(name) {
  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) {
    throw new Error("Invalid file name");
  }
}

function fileResponse(c, filePath, downloadName, contentType) {
  if (!fs.existsSync(filePath)) {
    return c.json({ error: "File not found. Generate it first." }, 404);
  }

  c.header("Content-Type", contentType);
  c.header("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
  c.header("Cache-Control", "no-store");
  return c.body(fs.readFileSync(filePath));
}

function zipDirectory(dir, extension) {
  return new Promise((resolve, reject) => {
    const zip = new yazl.ZipFile();
    const chunks = [];

    zip.outputStream.on("data", (chunk) => chunks.push(chunk));
    zip.outputStream.on("error", reject);
    zip.outputStream.on("end", () => resolve(Buffer.concat(chunks)));

    for (const file of listFiles(dir, extension)) {
      zip.addFile(path.join(dir, file.name), file.name);
    }
    zip.end();
  });
}

app.get("/", (c) =>
  c.json({
    name: "TrainerHub Document API",
    endpoints: {
      health: "GET /health",
      generateDocx: "POST /api/docx/generate",
      listDocx: "GET /api/docx/files",
      downloadDocxZip: "GET /api/docx/download.zip",
      downloadDocxFile: "GET /api/docx/files/:name",
      generatePptx: "POST /api/pptx/generate",
      downloadPptx: "GET /api/pptx/download",
      generateMasterDocx: "POST /api/master/:documentType/docx",
      listMasterDocx: "GET /api/master/files",
      downloadMasterDocxFile: "GET /api/master/files/:name"
    }
  })
);

app.get("/health", (c) => c.json({ ok: true }));

app.post("/api/docx/generate", async (c) => {
  const result = await runCommand("npm", ["run", "generate:js"], docxDir);
  return c.json({
    ok: true,
    generator: "docx-js",
    durationMs: result.durationMs,
    files: listFiles(docxOutputDir, ".docx"),
    downloadZip: "/api/docx/download.zip"
  });
});

app.get("/api/docx/files", (c) => c.json({ files: listFiles(docxOutputDir, ".docx") }));

app.get("/api/docx/download.zip", async (c) => {
  const files = listFiles(docxOutputDir, ".docx");
  if (files.length === 0) {
    return c.json({ error: "No DOCX files found. Generate them first." }, 404);
  }
  const buffer = await zipDirectory(docxOutputDir, ".docx");
  c.header("Content-Type", "application/zip");
  c.header("Content-Disposition", "attachment; filename=\"generated-docx.zip\"");
  c.header("Cache-Control", "no-store");
  return c.body(buffer);
});

app.get("/api/docx/files/:name", (c) => {
  const name = decodeURIComponent(c.req.param("name"));
  try {
    assertSafeName(name);
  } catch {
    return c.json({ error: "Invalid file name" }, 400);
  }
  return fileResponse(
    c,
    path.join(docxOutputDir, name),
    name,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
});

app.post("/api/pptx/generate", async (c) => {
  const result = await runCommand("npm", ["run", "generate"], pptxDir);
  const stat = fs.statSync(pptxOutputPath);
  return c.json({
    ok: true,
    generator: "pptxgenjs",
    durationMs: result.durationMs,
    file: {
      name: path.basename(pptxOutputPath),
      size: stat.size,
      updatedAt: stat.mtime.toISOString()
    },
    download: "/api/pptx/download"
  });
});

app.get("/api/pptx/download", (c) =>
  fileResponse(
    c,
    pptxOutputPath,
    path.basename(pptxOutputPath),
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  )
);

// --- Master DOCX (AI for Master) ---
const masterOutputDir = path.join(__dirname, "../src/master/output");

app.post("/api/master/:documentType/docx", async (c) => {
  const documentType = c.req.param("documentType");
  const payload = await c.req.json();
  const buffer = await packDocxMasterDocument(documentType, payload);
  const filename = `${documentType}.docx`;

  if (!fs.existsSync(masterOutputDir)) fs.mkdirSync(masterOutputDir, { recursive: true });
  fs.writeFileSync(path.join(masterOutputDir, filename), buffer);

  c.header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  c.header("Content-Disposition", `attachment; filename="${filename}"`);
  c.header("Cache-Control", "no-store");
  return c.body(buffer);
});

app.get("/api/master/files", (c) => {
  if (!fs.existsSync(masterOutputDir)) return c.json({ files: [] });
  return c.json({ files: listFiles(masterOutputDir, ".docx") });
});

app.get("/api/master/files/:name", (c) => {
  const name = decodeURIComponent(c.req.param("name"));
  try { assertSafeName(name); } catch { return c.json({ error: "Invalid file name" }, 400); }
  return fileResponse(c, path.join(masterOutputDir, name), name, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
});

// --- Trainer DOCX ---
app.post("/api/trainer/:documentType/docx", async (c) => {
  const documentType = c.req.param("documentType");
  const payload = await c.req.json();
  const buffer = await packDocxTrainerDocument(documentType, payload);
  const filename = `${documentType}.docx`;
  c.header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  c.header("Content-Disposition", `attachment; filename="${filename}"`);
  c.header("Cache-Control", "no-store");
  return c.body(buffer);
});

app.get("/api/trainer/types", (c) => c.json({ types: TRAINER_DOCUMENT_TYPES }));

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message,
      stderr: err.stderr
    },
    500
  );
});

export default app;
