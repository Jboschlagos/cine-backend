import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    // La exportación de Instagram vive fuera del proyecto (IG_EXPORT_DIR en .env.local).
    // Si algún día la copias dentro, agrega su carpeta aquí.
  ]),
]);
