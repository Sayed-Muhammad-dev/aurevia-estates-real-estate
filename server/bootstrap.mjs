import { bootstrap } from "./backend.mjs";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
const password =
  process.env.OWNER_PASSWORD || randomBytes(24).toString("base64url");
const email = process.env.OWNER_EMAIL || "owner@aurevia.local";
const name = process.env.OWNER_NAME || "Workspace Owner";
await bootstrap(email, name, password);
await mkdir(".app-data", { recursive: true });
await writeFile(
  ".app-data/local-owner.json",
  JSON.stringify({ email, password }, null, 2),
  { mode: 0o600 },
);
console.log(
  "Local owner created. Credentials are in the ignored .app-data/local-owner.json file.",
);
