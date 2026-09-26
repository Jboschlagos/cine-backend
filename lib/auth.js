import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Better Auth maneja su propia conexión a Postgres (tablas: user, session,
// account, verification). Es una conexión aparte de lib/db.js, que se usa
// solo para nuestras tablas de reviews/comments.
export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    // No queremos que cualquiera pueda registrarse como admin.
    // Si tu versión de better-auth no reconoce esta opción, revisá
    // la doc actual (https://www.better-auth.com/docs) por el nombre
    // exacto — la idea es: registro deshabilitado, solo vos entrás
    // con el usuario creado por db/create-admin.mjs.
    disableSignUp: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});
