// Uso: node --env-file=.env.local db/reset-password.mjs <email> <nueva_contraseña>
import { auth } from "../lib/auth.js";

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error("Uso: node --env-file=.env.local db/reset-password.mjs <email> <nueva_contraseña>");
  process.exit(1);
}

const ctx = await auth.$context;
const found = await ctx.internalAdapter.findUserByEmail(email);

if (!found) {
  console.error("No existe un usuario con ese email");
  process.exit(1);
}

const hash = await ctx.password.hash(newPassword);
await ctx.internalAdapter.updatePassword(found.user.id, hash);

console.log("Contraseña actualizada para", email);
process.exit(0);
