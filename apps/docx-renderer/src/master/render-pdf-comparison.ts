// Run from: cd /home/ujang/0new/thub/trainerhub-beta && npx tsx thisfile.ts
import fs from 'node:fs';
import path from 'node:path';

const { createReactPdfMasterDocument } = await import('/home/ujang/0new/thub/trainerhub-beta/apps/backend/src/modules/ai-document/services/react-pdf-master-document.factory');
const ReactPDF = await import('@react-pdf/renderer');

const payloads = JSON.parse(fs.readFileSync('/home/ujang/0new/thub/playground/api/src/master/sample-payloads.json', 'utf-8'));
const outputDir = '/home/ujang/0new/thub/playground/master-output-pdf';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

for (const [docType, payload] of Object.entries(payloads)) {
  try {
    const doc = await createReactPdfMasterDocument(docType, payload as Record<string, unknown>);
    const stream = await ReactPDF.renderToStream(doc as any);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk as any));
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(path.join(outputDir, `${docType}.pdf`), buffer);
    console.log(`✓ ${docType}.pdf (${buffer.length} bytes)`);
  } catch (err: any) {
    console.error(`✗ ${docType}: ${err.message}`);
  }
}
