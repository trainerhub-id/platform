# TrainerHub Document API

Hono service untuk generate dan download DOCX/PPTX dari generator di folder `docx` dan `pptx`.

## Menjalankan

```bash
cd api
npm install
npm run start
```

Default port: `8787`. Bisa diubah dengan env `PORT`.

## Endpoint

- `GET /health`
- `POST /api/docx/generate`
- `GET /api/docx/files`
- `GET /api/docx/download.zip`
- `GET /api/docx/files/:name`
- `POST /api/pptx/generate`
- `GET /api/pptx/download`

## Contoh

```bash
curl -X POST http://localhost:8787/api/docx/generate
curl -o generated-docx.zip http://localhost:8787/api/docx/download.zip

curl -X POST http://localhost:8787/api/pptx/generate
curl -o output-sdm-js.pptx http://localhost:8787/api/pptx/download
```
