"use client";

import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

// Carrusel de imágenes de una reseña. Recibe una lista de URLs.
export default function ImageCarousel({ images, alt }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1 });
  const [selected, setSelected] = useState(0);

  // Cada vez que el carrusel cambia de imagen, actualizamos el punto activo.
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  if (images.length === 0) return null;

  return (
    // En 2 columnas (md+) el ancho se limita según el alto de la ventana para que el
    // afiche 2:3 quepa completo bajo el header fijo (~65px): top-20 + 1rem de aire abajo.
    <div className="relative w-full self-start md:sticky md:top-20 md:max-w-[calc((100svh_-_6rem)*2/3)] md:justify-self-center">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="min-w-0 flex-[0_0_100%]">
              <img
                src={src}
                alt={`${alt} — imagen ${i + 1}`}
                className="aspect-[2/3] w-full bg-neutral-900 object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Imagen anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1 text-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Imagen siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1 text-white"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Ir a la imagen ${i + 1}`}
                className={`h-2 w-2 rounded-full ${i === selected ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
