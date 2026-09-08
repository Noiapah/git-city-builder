import dotenv from "dotenv";
import { resolve } from "node:path";
import { createApp } from "./app.js";
dotenv.config({ path: resolve(process.cwd(), ".env"), quiet: true });
const clientDist = resolve(process.cwd(), "../client/dist");
const app = createApp(clientDist);
const port = Number(process.env.PORT || 3000);
app.listen(port, "127.0.0.1", () =>
  console.log(`GitHub City API: http://127.0.0.1:${port}`),
);
