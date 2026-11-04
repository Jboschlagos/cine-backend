export const metadata = { title: "Sobre mí" };

// BORRADOR: Jorge todavía tiene que revisar este texto.
export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-10 text-center font-display text-sm uppercase tracking-[0.35em] text-neutral-500">
        Sobre mí
      </h1>
      <div className="flex flex-col gap-6 text-lg leading-relaxed text-neutral-200">
        <p>Hola, soy Jorge.</p>
        <p>
          Durante diez años fui carpintero mueblista en mi propio taller. Ahí aprendí que las
          cosas se entienden mejor cuando las desarmas: ver cómo encaja una pieza con otra, por
          qué algo se sostiene y por qué no. Después llegué al desarrollo web y descubrí que el
          código se parece bastante a eso. Este sitio lo armé yo, pieza por pieza, como un mueble.
        </p>
        <p>
          Con el cine me pasa lo mismo. No soy crítico ni cinéfilo de manual: hay muchísimas
          películas que no he visto y muchas cosas que no sé. Lo que tengo es curiosidad. Me fijo
          en la fotografía, en el montaje, en los afiches y, sobre todo, en la música, en esa
          banda sonora que se te queda pegada días después de ver una película.
        </p>
        <p>
          Reducido es un experimento. Un lugar para anotar lo que me provocan las películas,
          aprender en el camino y compartirlo, con más preguntas que respuestas. Si crees que se
          me pasó algo o tienes una película para recomendarme,{" "}
          <a href="/contacto" className="underline decoration-neutral-600 underline-offset-4 hover:decoration-white">
            escríbeme
          </a>
          . Para eso está.
        </p>
      </div>
    </main>
  );
}
