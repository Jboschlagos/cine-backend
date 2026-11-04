// Logo "Formato cine": la palabra REDUCIDO recortada arriba y abajo
// entre dos líneas, como una película en pantalla panorámica.
// Es un SVG: se escala sin perder calidad. El tamaño se controla con className.
export default function Logo({ className = "" }) {
  return (
    <svg viewBox="0 0 300 60" className={className} role="img" aria-label="Reducido">
      <defs>
        <clipPath id="reducido-logo-clip">
          <rect y="11.5" width="300" height="37" />
        </clipPath>
      </defs>
      <text
        x="150"
        y="53.5"
        textAnchor="middle"
        fontSize="60"
        fontWeight="600"
        letterSpacing="6"
        fill="currentColor"
        clipPath="url(#reducido-logo-clip)"
        style={{ fontFamily: "var(--font-oswald), 'Arial Narrow', sans-serif" }}
      >
        REDUCIDO
      </text>
      <rect y="7" width="300" height="2.7" fill="currentColor" />
      <rect y="50.3" width="300" height="2.7" fill="currentColor" />
    </svg>
  );
}
