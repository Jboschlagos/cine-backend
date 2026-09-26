// Script de un solo uso para crear tu usuario admin.
// Correr con: node --env-file=.env.local db/create-admin.mjs <email> <password> [nombre]

import { auth } from "../lib/auth.js";

const [, , email, password, name] = process.argv;

if (!email || !password) {
  console.error(
    "Uso: node --env-file=.env.local db/create-admin.mjs <email> <password> [nombre]"
  );
  process.exit(1);
}

const result = await auth.api.signUpEmail({
  body: { email, password, name: name ?? "Admin" },
});

console.log("Usuario admin creado:", result?.user?.email ?? result);
process.exit(0);
