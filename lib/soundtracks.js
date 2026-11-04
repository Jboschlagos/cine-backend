// Bandas sonoras del reproductor al azar (barra fija abajo).
// Para agregar una: en Spotify, álbum -> ⋯ -> Compartir -> Copiar enlace,
// y pega el ID (lo que va después de /album/ o /playlist/).
const album = (id) => `https://open.spotify.com/embed/album/${id}`;
const playlist = (id) => `https://open.spotify.com/embed/playlist/${id}`;

export const SOUNDTRACKS = [
  { movie: "Blade Runner", by: "Vangelis", embed: album("6NkuCdMz5tGmHbOXAWbtCW") },
  { movie: "La misión", by: "Ennio Morricone", embed: album("2fOlcWrSR032MxwMCQe9LA") },
  { movie: "Grease", by: "Varios artistas", embed: album("5n47Dui0H3pGpZSOxITmoq") },
  { movie: "Interstellar", by: "Hans Zimmer", embed: album("7a78GiEowpaCa7ZJs44xUU") },
  { movie: "Red social", by: "Trent Reznor & Atticus Ross", embed: album("1ijkFiMeHopKkHyvQCWxUa") },
  { movie: "Nacido el 4 de julio", by: "John Williams", embed: album("2CUnD4nowpfqwYL0c5cVrb") },
  { movie: "Réquiem por un sueño", by: "Clint Mansell & Kronos Quartet", embed: album("7Jkv05qDgXZynnNaYcxY5W") },
  { movie: "Underground", by: "Goran Bregović", embed: album("2xMLHeRDiuzNWIrZt7Q8na") },
  { movie: "Gato negro, gato blanco", by: "No Smoking Orchestra", embed: playlist("64rc6xnbrqDkcLx65JK90A") },
  { movie: "La mosca", by: "Howard Shore", embed: album("67OWRZwehgGudnhxaP50OB") },
  { movie: "Una historia violenta", by: "Howard Shore", embed: album("46IrDDc5jkpVKUQYFE0oMa") },
  { movie: "Crash", by: "Howard Shore", embed: album("7G2J1bur9LstntD1wVVFlw") },
  { movie: "La llegada", by: "Jóhann Jóhannsson", embed: album("3GDfBsNm22NeGSP2vQDWnO") },
  { movie: "Ascensor para el cadalso", by: "Miles Davis", embed: album("2RB9kRfUPYWwXzzELn6NcT") },
  { movie: "Whiplash", by: "Justin Hurwitz y varios", embed: album("7bsistH3CCaUMqHCjNFpZT") },
  { movie: "Anatomía de un asesinato", by: "Duke Ellington", embed: album("3WbMnT3abDjzrCzZQ9WtLK") },
  { movie: "Birdman", by: "Antonio Sánchez", embed: album("6IlyytRzjYVOQ7cBrVVdwR") },
  { movie: "Hackers", by: "Varios artistas", embed: playlist("5QXI27iYeAGrt7iR8weYAv") },
  { movie: "Tron: Legacy", by: "Daft Punk", embed: album("3AMXFnwHWXCvNr5NCCpLZI") },
  { movie: "Cinema Paradiso", by: "Ennio Morricone", embed: album("0hvxA5cmM7GmXxYSd3kkK5") },
  { movie: "Sicario", by: "Jóhann Jóhannsson", embed: album("04FRFSqcTfN9zfmFfzhbHn") },
  { movie: "Pulp Fiction", by: "Varios artistas", embed: album("2Rosrqy5gnHaKLrh2ctnVq") },
  { movie: "Drive", by: "Cliff Martinez y varios", embed: album("3fKas0iq7DWAylIQxGEIQW") },
];
