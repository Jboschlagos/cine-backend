import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

// Imagen que muestran WhatsApp, Instagram, etc. al compartir un link del sitio.
// Next la convierte en un PNG y la agrega sola a los metadatos (og:image).
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// El logo (components/Logo.js) mide 300x60; aquí lo dibujamos 3 veces más grande.
const S = 3;

export default async function Image() {
  // ImageResponse no puede usar next/font: le pasamos los archivos .ttf directo.
  const [semiBold, regular] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Oswald-SemiBold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Oswald-Regular.ttf")),
  ]);

  const line = { position: "absolute", left: 0, width: 300 * S, height: 2.7 * S, background: "#fff" };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Oswald",
        }}
      >
        {/* Logo "formato cine": REDUCIDO recortado arriba y abajo entre dos líneas */}
        <div style={{ position: "relative", display: "flex", width: 300 * S, height: 53 * S }}>
          <div style={{ ...line, top: 7 * S }} />
          {/* Ventana que recorta las letras (overflow hidden = lo que sale, no se ve) */}
          <div
            style={{
              position: "absolute",
              top: 11.5 * S,
              left: 0,
              width: 300 * S,
              height: 37 * S,
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -45,
                fontSize: 60 * S,
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: 6 * S,
                paddingLeft: 6 * S, // compensa el espacio que queda después de la última letra
                color: "#fff",
              }}
            >
              REDUCIDO
            </div>
          </div>
          <div style={{ ...line, top: 50.3 * S }} />
        </div>

        {/* La frase, chica y en gris, como en el encabezado */}
        <div
          style={{
            marginTop: 48,
            fontSize: 30,
            fontWeight: 400,
            letterSpacing: 12,
            paddingLeft: 12,
            textTransform: "uppercase",
            color: "#737373",
          }}
        >
          {SITE.tagline}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Oswald", data: semiBold, weight: 600, style: "normal" },
        { name: "Oswald", data: regular, weight: 400, style: "normal" },
      ],
    }
  );
}
