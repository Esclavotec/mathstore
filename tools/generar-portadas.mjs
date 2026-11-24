// Genera las portadas SVG (640×360) de covers/. Uso: node tools/generar-portadas.mjs
// Cada portada es una ilustración propia y sencilla del tema del recurso.
import { writeFileSync, mkdirSync } from "node:fs";

const W = 640, H = 360;
const FUENTE = "'Arial Black', 'Segoe UI Black', Impact, sans-serif";

/** Marco común: fondo, cuadrícula, ilustración y título. */
function portada({ fondo, fondo2, tinta, titulo, sub, arte }) {
  let rejilla = "";
  for (let x = 0; x <= W; x += 32) rejilla += `<path d="M${x} 0V${H}"/>`;
  for (let y = 0; y <= H; y += 32) rejilla += `<path d="M0 ${y}H${W}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${fondo}"/><stop offset="1" stop-color="${fondo2}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<g stroke="${tinta}" stroke-opacity="0.08" stroke-width="1">${rejilla}</g>
${arte}
<text x="32" y="${H - 58}" font-family="${FUENTE}" font-size="44" fill="${tinta}" letter-spacing="-1">${titulo}</text>
<text x="34" y="${H - 28}" font-family="Consolas, monospace" font-size="17" fill="${tinta}" fill-opacity="0.75" letter-spacing="2">${sub}</text>
</svg>`;
}

const portadas = {
  "carrera-tablas": portada({
    fondo: "#1d3a2f", fondo2: "#0f201a", tinta: "#f4f1e6", titulo: "CARRERA DE TABLAS", sub: "MULTIPLICA CONTRA EL RELOJ",
    arte: `<g font-family="${FUENTE}" fill="#f2cf5b">
      <text x="330" y="150" font-size="120" transform="rotate(-8 450 110)">7×8</text>
      <text x="80" y="120" font-size="54" fill="#8fdc9e" fill-opacity="0.8">=56</text></g>
      <g stroke="#f4f1e6" stroke-width="6" stroke-linecap="round" stroke-opacity="0.5"><path d="M40 190h120M70 210h150M30 230h90"/></g>
      <circle cx="586" cy="200" r="30" fill="none" stroke="#f4f1e6" stroke-width="6"/><path d="M586 200V182M586 200l13 9" stroke="#f4f1e6" stroke-width="6" stroke-linecap="round"/>`
  }),
  "fraccion-exacta": portada({
    fondo: "#3a2a1d", fondo2: "#1e140c", tinta: "#f8ecdc", titulo: "FRACCIÓN EXACTA", sub: "¿CUÁL ES MAYOR?",
    arte: `<g transform="translate(360 40)">
      <circle cx="90" cy="90" r="80" fill="#4a3624" stroke="#f8ecdc" stroke-width="4"/>
      <path d="M90 90V10A80 80 0 0 1 169 103Z" fill="#f2cf5b"/>
      <path d="M90 90L169 103A80 80 0 0 1 120 164Z" fill="#f2cf5b" fill-opacity="0.6"/>
      </g>
      <g font-family="${FUENTE}" fill="#f8ecdc"><text x="60" y="110" font-size="72">3</text><rect x="52" y="122" width="62" height="7" fill="#f8ecdc"/><text x="56" y="190" font-size="72">8</text>
      <text x="150" y="160" font-size="60" fill="#ef8f9c">&lt;</text>
      <text x="230" y="110" font-size="72">1</text><rect x="222" y="122" width="62" height="7" fill="#f8ecdc"/><text x="226" y="190" font-size="72">2</text></g>`
  }),
  "angulo-ninja": portada({
    fondo: "#1c2540", fondo2: "#0c1122", tinta: "#e8edf8", titulo: "ÁNGULO NINJA", sub: "ESTIMA LOS GRADOS",
    arte: `<g stroke-linecap="round" fill="none">
      <path d="M250 230H600" stroke="#e8edf8" stroke-width="10"/>
      <path d="M250 230L470 50" stroke="#e8edf8" stroke-width="10"/>
      <path d="M340 230A90 90 0 0 0 320 173" stroke="#f2cf5b" stroke-width="8"/>
      <path d="M250 230L560 120" stroke="#8fdc9e" stroke-width="6" stroke-dasharray="16 12"/></g>
      <text x="360" y="200" font-family="${FUENTE}" font-size="40" fill="#f2cf5b">39°</text>
      <path d="M40 60l60 20-60 20 20-20z" fill="#ef8f9c"/>`
  }),
  "fichas-sumas-restas": portada({
    fondo: "#f1ead8", fondo2: "#d9cfb5", tinta: "#2a2418", titulo: "SUMAS Y RESTAS", sub: "FICHAS IMPRIMIBLES · PDF",
    arte: `<g transform="rotate(-6 450 120)"><rect x="350" y="20" width="220" height="200" rx="6" fill="#fffdf6" stroke="#2a2418" stroke-width="3"/>
      <g font-family="Consolas, monospace" font-size="30" fill="#2a2418" text-anchor="end"><text x="520" y="80">347</text><text x="520" y="118">+ 185</text></g>
      <path d="M410 132H530" stroke="#2a2418" stroke-width="3"/><text x="520" y="170" font-family="Consolas, monospace" font-size="30" fill="#c0392b" text-anchor="end">532</text></g>
      <g font-family="${FUENTE}" font-size="90" fill="#2a2418" fill-opacity="0.15"><text x="40" y="150">+ −</text></g>`
  }),
  "fichas-ecuaciones": portada({
    fondo: "#e4eef0", fondo2: "#bcd2d6", tinta: "#13262b", titulo: "ECUACIONES", sub: "PRIMER GRADO · PDF",
    arte: `<g font-family="${FUENTE}" fill="#13262b"><text x="40" y="130" font-size="78">2x + 3 = 11</text></g>
      <g font-family="Consolas, monospace" font-size="30" fill="#13262b" fill-opacity="0.7"><text x="420" y="190">x = 4</text></g>
      <rect x="410" y="160" width="130" height="44" rx="6" fill="none" stroke="#c0392b" stroke-width="4"/>
      <path d="M560 40l40 40M600 40l-40 40" stroke="#13262b" stroke-width="6" stroke-linecap="round" stroke-opacity="0.3"/>`
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
