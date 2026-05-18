import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use trainerhub-beta's react-pdf factory
const factoryPath = "/home/ujang/0new/thub/trainerhub-beta/apps/backend/src/modules/ai-document/services/react-pdf-master-document.factory.ts";

// We need to run this from trainerhub-beta context for imports to work
const payloads = JSON.parse(fs.readFileSync(path.join(__dirname, "sample-payloads.json"), "utf-8"));
const outputDir = path.join(__dirname, "output-pdf");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Write payload file for the tsx script
fs.writeFileSync(path.join(outputDir, "payloads.json"), JSON.stringify(payloads));
console.log("Payloads written. Now run the tsx script from trainerhub-beta.");
