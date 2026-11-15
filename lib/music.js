// Aviso interno del navegador para pausar la banda sonora fija de abajo (SoundtrackPlayer).
// Cualquier componente puede llamar a pauseMusic() sin conocer al reproductor:
// ej. el tráiler, justo antes de empezar a sonar. Solo funciona en el navegador.
export const PAUSE_MUSIC_EVENT = "reducido:pausar-musica";

export function pauseMusic() {
  window.dispatchEvent(new Event(PAUSE_MUSIC_EVENT));
}
