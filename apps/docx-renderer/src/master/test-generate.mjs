import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { packDocxMasterDocument } from "./docx-master-document.factory.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const payloads = JSON.parse(fs.readFileSync(path.join(__dirname, "sample-payloads.json"), "utf-8"));
const outputDir = path.join(__dirname, "output");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const results = [];

for (const [docType, payload] of Object.entries(payloads)) {
  const start = Date.now();
  try {
    const buffer = await packDocxMasterDocument(docType, payload);
    const filename = `${docType}.docx`;
    fs.writeFileSync(path.join(outputDir, filename), buffer);
    const ms = Date.now() - start;
    results.push({ docType, status: "ok", size: buffer.length, ms });
    console.log(`✓ ${filename} (${buffer.length} bytes, ${ms}ms)`);
  } catch (err) {
    const ms = Date.now() - start;
    results.push({ docType, status: "FAIL", error: err.message, ms });
    console.error(`✗ ${docType}: ${err.message}`);
  }
}

console.log(`\n--- Results: ${results.filter(r => r.status === "ok").length}/${results.length} passed ---`);
if (results.some(r => r.status === "FAIL")) process.exit(1);
