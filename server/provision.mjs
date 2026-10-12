import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL)
  throw new Error(
    "DATABASE_URL is required. Use a separate database for this application.",
  );
const sql = neon(process.env.DATABASE_URL);
await sql`CREATE TABLE IF NOT EXISTS application_state(application_key text PRIMARY KEY,payload jsonb NOT NULL,revision integer NOT NULL)`;
console.log(
  "Application state table provisioned. No existing rows were changed.",
);
