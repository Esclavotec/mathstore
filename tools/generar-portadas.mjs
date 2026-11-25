// Genera las portadas SVG (640×360) de covers/. Uso: npm run portadas
// Cada portada es una ilustración propia y sencilla del recurso.
// (La portada de "La tiendita de los cuadriláteros" es una imagen aportada: covers/tiendita-cuadrilateros.webp)
import { writeFileSync, mkdirSync } from "node:fs";

const W = 640, H = 360;
const FUENTE = "'Arial Black', 'Segoe UI Black', Impact, sans-serif";

/** Marco común: fondo, cuadrícula, ilustración y título. */
function portada({ fondo, fondo2, tinta, titulo, sub, arte, tam = 44 }) {
  let rejilla = "";
  for (let x = 0; x <= W; x += 32) rejilla += `<path d="M${x} 0V${H}"/>`;
  for (let y = 0; y <= H; y += 32) rejilla += `<path d="M0 ${y}H${W}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${fondo}"/><stop offset="1" stop-color="${fondo2}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<g stroke="${tinta}" stroke-opacity="0.08" stroke-width="1">${rejilla}</g>
${arte}
<text x="32" y="${H - 58}" font-family="${FUENTE}" font-size="${tam}" fill="${tinta}" letter-spacing="-1">${titulo}</text>
<text x="34" y="${H - 28}" font-family="Consolas, monospace" font-size="17" fill="${tinta}" fill-opacity="0.75" letter-spacing="2">${sub}</text>
</svg>`;
}

/** Auto de carreras visto de lado (mismo dibujo que en el juego). */
const auto = (x, y, esc, carroceria) => `<g transform="translate(${x} ${y}) scale(${esc})">
  <path d="M8 38c0-8 6-12 14-13l18-2 14-12c3-3 7-4 11-4h17c5 0 9 2 12 6l8 10 8 2c4 1 6 4 6 8v5c0 2-2 4-4 4H12c-2 0-4-2-4-4z" fill="${carroceria}"/>
  <path d="M48 22l10-9c2-2 4-3 7-3h14c3 0 5 1 7 4l6 8z" fill="#14211d"/>
  <circle cx="32" cy="46" r="9" fill="#111"/><circle cx="32" cy="46" r="4" fill="#9aa"/>
  <circle cx="92" cy="46" r="9" fill="#111"/><circle cx="92" cy="46" r="4" fill="#9aa"/></g>`;

/** Porción de pizza: cuña desde el centro (cx, cy) entre los ángulos a0 y a1 (grados). */
function cuna(cx, cy, r, a0, a1, relleno) {
  const p = (a) => [cx + Math.cos(a * Math.PI / 180) * r, cy + Math.sin(a * Math.PI / 180) * r].map((n) => n.toFixed(1)).join(" ");
  return `<path d="M${cx} ${cy}L${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}Z" fill="${relleno}"/>`;
}

const portadas = {
  "carrera-tablas": portada({
    fondo: "#1d3a2f", fondo2: "#0f201a", tinta: "#f4f1e6", titulo: "CARRERA DE TABLAS", sub: "MULTIPLICA Y ACELERA",
    arte: `<rect x="0" y="120" width="${W}" height="118" fill="#2a2f2d"/>
      <path d="M0 122H${W}M0 236H${W}" stroke="#c9cfcb" stroke-width="5"/>
      <path d="M0 179H${W}" stroke="#e9efe9" stroke-width="4" stroke-dasharray="26 22"/>
      <rect x="596" y="120" width="44" height="118" fill="url(#cuadros)"/>
      <defs><pattern id="cuadros" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#fff"/><rect width="11" height="11" fill="#111"/><rect x="11" y="11" width="11" height="11" fill="#111"/></pattern></defs>
      <path d="M232 152h-60M220 142h-40M226 162h-34" stroke="#ffb02e" stroke-width="5" stroke-linecap="round"/>
      ${auto(240, 122, 1.05, "#f2cf5b")}
      ${auto(80, 182, 1.05, "#7cc4e8")}
      <g font-family="${FUENTE}" fill="#f2cf5b"><text x="380" y="92" font-size="64" transform="rotate(-6 470 70)">7×8=56</text></g>`
  }),
  "pizzeria-fracciones": portada({
    fondo: "#7a2e1f", fondo2: "#3d140c", tinta: "#fff3e0", tam: 34, titulo: "PIZZERÍA DE FRACCIONES", sub: "SIRVE 3/4 DE PIZZA",
    arte: `<circle cx="470" cy="140" r="112" fill="#6b4a2b" stroke="#4e341d" stroke-width="6"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => i < 6
        ? `<g>${cuna(470, 140, 100, i * 45 - 90, i * 45 - 45, "#d9a35b")}${cuna(470, 140, 88, i * 45 - 90, i * 45 - 45, "#f5c84c")}</g>`
        : cuna(470, 140, 100, i * 45 - 90, i * 45 - 45, "rgba(0,0,0,0.15)")).join("")}
      <g stroke="#9c6b35" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M470 140L${(470 + Math.cos((i * 45 - 90) * Math.PI / 180) * 100).toFixed(1)} ${(140 + Math.sin((i * 45 - 90) * Math.PI / 180) * 100).toFixed(1)}"/>`).join("")}</g>
      <g fill="#b8322e">${[0, 1, 2, 3, 4, 5].map((i) => { const a = (i * 45 - 67.5) * Math.PI / 180; return `<circle cx="${(470 + Math.cos(a) * 58).toFixed(1)}" cy="${(140 + Math.sin(a) * 58).toFixed(1)}" r="10"/>`; }).join("")}</g>
      <g transform="translate(70 40)"><rect width="190" height="120" rx="22" fill="#fff3e0"/><path d="M60 120l-6 24 30-24z" fill="#fff3e0"/>
        <text x="95" y="56" text-anchor="middle" font-family="${FUENTE}" font-size="44" fill="#3d140c">6</text>
        <rect x="70" y="66" width="50" height="6" fill="#3d140c"/>
        <text x="95" y="110" text-anchor="middle" font-family="${FUENTE}" font-size="44" fill="#3d140c">8</text>
        <text x="150" y="88" font-family="${FUENTE}" font-size="30" fill="#b8322e">=</text></g>`
  }),
  "angulo-ninja": portada({
    fondo: "#1c2540", fondo2: "#0c1122", tinta: "#e8edf8", titulo: "ÁNGULO NINJA", sub: "LANZA A 135°",
    arte: `<circle cx="80" cy="60" r="26" fill="#f4f1e6" fill-opacity="0.9"/>
      <path d="M150 240H560" stroke="#e8edf8" stroke-width="7" stroke-linecap="round"/>
      <path d="M350 240A200 200 0 0 0 150 240" fill="none" stroke="#e8edf8" stroke-opacity="0.15" stroke-width="3" stroke-dasharray="6 12"/>
      <path d="M350 240L240 120" stroke="#f2cf5b" stroke-width="5" stroke-dasharray="4 12" stroke-linecap="round"/>
      <path d="M410 240A60 60 0 0 0 310 196" fill="none" stroke="#8fdc9e" stroke-width="5"/>
      <text x="400" y="200" font-family="${FUENTE}" font-size="34" fill="#8fdc9e">135°</text>
      <g transform="translate(240 112)"><circle r="34" fill="#f2cf5b" fill-opacity="0.18"/><rect x="-10" y="-24" width="20" height="6" fill="#2b1d14"/><rect x="-10" y="18" width="20" height="6" fill="#2b1d14"/><ellipse rx="17" ry="20" fill="#e5484d"/></g>
      <g transform="translate(300 175) rotate(20)" fill="#cfd8dc"><path d="M0-5L18 0 0 5z"/><path d="M0-5L18 0 0 5z" transform="rotate(90)"/><path d="M0-5L18 0 0 5z" transform="rotate(180)"/><path d="M0-5L18 0 0 5z" transform="rotate(270)"/></g>
      <g transform="translate(350 240)"><ellipse cy="-10" rx="18" ry="14" fill="#1a1a1a"/><circle cy="-36" r="16" fill="#1a1a1a"/><rect x="-16" y="-44" width="32" height="6" fill="#e5484d"/><path d="M-15-42l-16-8 2 13z" fill="#e5484d"/><rect x="-11" y="-38" width="22" height="7" fill="#f1c7a5"/><rect x="-7" y="-37" width="4" height="4" fill="#1a1a1a"/><rect x="3" y="-37" width="4" height="4" fill="#1a1a1a"/></g>`
  }),
  "bolsa-cuadrilateros-geogebra": portada({
    fondo: "#eef2f7", fondo2: "#c9d4e3", tinta: "#1d2733", tam: 38, titulo: "BOLSA DE CUADRILÁTEROS", sub: "ORIGINAL · GEOGEBRA · PROMATES",
    arte: `<g transform="translate(420 18)">
        <path d="M20 70 L180 70 L196 206 L4 206 Z" fill="#c99b6a" stroke="#1d2733" stroke-width="5" stroke-linejoin="round"/>
        <path d="M20 70 L180 70 L178 92 L22 92 Z" fill="#b5854f"/>
        <path d="M52 72 C52 22 92 22 92 72 M108 72 C108 22 148 22 148 72" fill="none" stroke="#8a6542" stroke-width="8"/>
        <rect x="40" y="38" width="46" height="46" fill="#5b8def" stroke="#1d2733" stroke-width="4" transform="rotate(-10 63 61)"/>
        <polygon points="100,30 126,58 100,86 74,58" fill="#f2994a" stroke="#1d2733" stroke-width="4"/>
        <polygon points="126,46 170,46 160,80 116,80" fill="#2fae6a" stroke="#1d2733" stroke-width="4"/>
        <text x="100" y="160" text-anchor="middle" font-family="${FUENTE}" font-size="22" fill="#2b1a08">BOLSA</text></g>
      <g transform="translate(40 40)">
        <text x="0" y="34" font-family="${FUENTE}" font-size="26" fill="#1d2733">Actividad en GeoGebra</text>
        <rect x="0" y="70" width="140" height="34" rx="17" fill="#1d2733"/><text x="70" y="93" text-anchor="middle" font-family="Consolas, monospace" font-size="17" fill="#ffd23f" letter-spacing="2">ORIGINAL</text></g>`
  }),
  geogebra: portada({
    fondo: "#202233", fondo2: "#10111c", tinta: "#eceaf6", titulo: "GEOGEBRA", sub: "CALCULADORA GRÁFICA · WEB",
    arte: `<path d="M40 150H600M320 20V260" stroke="#eceaf6" stroke-opacity="0.4" stroke-width="2"/>
      <path d="M60 30 Q320 330 580 30" fill="none" stroke="#9aa2ff" stroke-width="6"/>
      <path d="M60 240 C200 40 420 260 580 60" fill="none" stroke="#f2cf5b" stroke-width="5"/>
      <circle cx="320" cy="180" r="9" fill="#eceaf6"/><circle cx="448" cy="154" r="9" fill="#eceaf6"/>`
  }),
  "khan-academy": portada({
    fondo: "#173b3a", fondo2: "#0b1f1f", tinta: "#e6f4f1", titulo: "KHAN ACADEMY", sub: "CURSOS DE MATEMÁTICAS · WEB",
    arte: `<g transform="translate(420 30)"><path d="M90 0l80 46v92l-80 46-80-46V46z" fill="#2b6f6a" stroke="#e6f4f1" stroke-width="4"/>
      <text x="90" y="118" font-family="${FUENTE}" font-size="70" fill="#e6f4f1" text-anchor="middle">∑</text></g>
      <g font-family="Consolas, monospace" font-size="22" fill="#e6f4f1" fill-opacity="0.5"><text x="40" y="70">1 + 1 = 2</text><text x="40" y="110">a² + b² = c²</text><text x="40" y="150">∫ x dx</text></g>`
  }),
  phet: portada({
    fondo: "#2e1f3a", fondo2: "#160e1d", tinta: "#f3e9f8", titulo: "PHET SIMULACIONES", sub: "INTERACTIVAS · WEB",
    arte: `<g transform="translate(380 30)"><rect width="200" height="150" rx="10" fill="#1b1224" stroke="#f3e9f8" stroke-width="3"/>
      <rect x="20" y="100" width="30" height="34" fill="#8fdc9e"/><rect x="62" y="70" width="30" height="64" fill="#7cc4e8"/><rect x="104" y="40" width="30" height="94" fill="#f2cf5b"/><rect x="146" y="85" width="30" height="49" fill="#ef8f9c"/></g>
      <g fill="#f3e9f8" fill-opacity="0.85"><circle cx="80" cy="80" r="22"/><circle cx="150" cy="120" r="14" fill-opacity="0.5"/><circle cx="220" cy="70" r="9" fill-opacity="0.35"/></g>`
  })
};

mkdirSync("covers", { recursive: true });
for (const [id, svg] of Object.entries(portadas)) writeFileSync(`covers/${id}.svg`, svg);
console.log(`Portadas generadas: ${Object.keys(portadas).length}`);
