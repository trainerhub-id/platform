import { serve } from "@hono/node-server";
import app from "./app.mjs";

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Document API listening on http://localhost:${info.port}`);
});
