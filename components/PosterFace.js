// Lo que se ve dentro de una tarjeta de afiche (reseñas y Descubrir):
// en reposo: afiche en blanco y negro + título abajo;
// al pasar el mouse: toma color y aparece la mini ficha (estilo "Taller").
// (usa <span> y no <div>/<p> porque en Descubrir va dentro de un <button>)
// rows = [["año", "2014"], ["dir.", "Nolan"], ...]  (las vacías no se muestran)
export const POSTER_CARD_CLASS =
  "group relative block aspect-[2/3] w-full overflow-hidden bg-neutral-950 text-left transition duration-300 hover:z-10 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.7)] focus-visible:outline focus-visible:outline-white";

export default function PosterFace({ image, title, rows = [] }) {
  return (
    <>
      {image ? (
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover brightness-75 grayscale transition duration-500 group-hover:brightness-100 group-hover:grayscale-0"
        />
      ) : (
        <span className="flex h-full items-center justify-center font-display text-xs uppercase tracking-[0.2em] text-neutral-600">
          Sin afiche
        </span>
      )}

      {/* Título en reposo (también sirve en celulares, donde no hay "hover") */}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 transition-opacity duration-300 group-hover:opacity-0">
        <span className="block truncate font-display text-xs uppercase tracking-[0.12em] text-white">{title}</span>
      </span>

      {/* Mini ficha al pasar el mouse */}
      <span className="absolute inset-0 flex flex-col justify-center gap-1 bg-black/80 p-4 font-mono text-[11px] leading-relaxed text-neutral-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="mb-2 block font-display text-base uppercase leading-tight tracking-[0.12em] text-white">{title}</span>
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <span key={label}>
              <span className="text-neutral-500">{label}</span> {value}
            </span>
          ))}
      </span>
    </>
  );
}
