import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact  (público) -> te envía el mensaje por correo usando Resend.
// Llamamos a la API de Resend directo con fetch, así no hay que instalar nada.
export async function POST(request) {
  const { name = "", email = "", message = "", website = "" } = await request.json();

  if (website) return NextResponse.json({ ok: true }); // bot: fingimos que salió bien

  if (!name.trim() || name.length > 80 || !EMAIL_RE.test(email) || email.length > 120 || !message.trim() || message.length > 3000) {
    return NextResponse.json({ error: "Revisa tu nombre, correo y mensaje." }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_EMAIL) {
    return NextResponse.json({ error: "El formulario todavía no está configurado." }, { status: 500 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Reducido <onboarding@resend.dev>", // remitente de prueba de Resend (sirve sin dominio propio)
      to: [process.env.CONTACT_EMAIL],
      reply_to: email.trim(), // al apretar "Responder" le contestas directo a la persona
      subject: `Mensaje de ${name.trim()} desde Reducido`,
      text: `${message.trim()}\n\n— ${name.trim()} (${email.trim()})`,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "No se pudo enviar el mensaje. Intenta más tarde." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
