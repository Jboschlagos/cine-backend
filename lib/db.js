import { neon } from "@neondatabase/serverless";

// DATABASE_URL se define en .env.local (ver .env.local.example)
export const sql = neon(process.env.DATABASE_URL);
