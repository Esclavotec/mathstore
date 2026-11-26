// Exporta cada juego propio como UN solo archivo HTML que funciona con doble clic y sin internet.
// Uso: npm run exportar   →   descargas/<id>.html
//
// Cada HTML lleva dentro: los estilos (css/styles.css), la lógica (js/logica.js), el kit (js/juegos/kit.js),
// el juego (js/juegos/<id>.js) y un "anfitrión" pequeño que hace lo mismo que el visor de la tienda
// (marcador, botón de sonido, pantalla final con estrellas y récord). Así hay una sola fuente de verdad:
// si cambias un juego en la tienda, vuelves a exportar y los HTML sueltos quedan al día.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const leer = (ruta) => readFileSync(ruta, "utf8");
const catalogo = JSON.parse(leer("data/catalogo.json"));
const JUEGOS = ["carrera-tablas", "pizzeria-fracciones", "angulo-ninja"];

const css = leer("css/styles.css");
const logica = leer("js/logica.js");
const kit = leer("js/juegos/kit.js");
const logo = "data:image/svg+xml;base64," + Buffer.from(leer("favicon.svg")).toString("base64");

/** Evita que un "</script>" dentro del código cierre la etiqueta antes de tiempo. */
const seguro = (js) => js.replace(/<\/script/gi, "<\\/script");
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Anfitrión: monta el juego con el mismo contrato que usa la tienda (ver js/juegos/carrera-tablas.js). */
const anfitrion = (id) => `
(function () {
  "use strict";
  var ID = ${JSON.stringify(id)};
  var escenario = document.getElementById("escenario"), marcador = document.getElementById("marcador");
  var botonSonido = document.getElementById("boton-sonido"), limpiar = null;
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function leerRecord() { try { return +localStorage.getItem("mathstore-record-" + ID) || 0; } catch (e) { return 0; } }
  function guardarRecord(p) { try { localStorage.setItem("mathstore-record-" + ID, p); } catch (e) { /* sin almacenamiento */ } }
  function pintarSonido() { var on = MathKit.sonido.on; botonSonido.setAttribute("aria-pressed", on); botonSonido.textContent = "Sonido: " + (on ? "sí" : "no"); }
  botonSonido.addEventListener("click", function () { MathKit.sonido.alternar(); pintarSonido(); });
  pintarSonido();

  function iniciar() {
    if (limpiar) limpiar();
    limpiar = MathJuegos[ID]({
      escenario: escenario,
      marcador: function (obj) {
        marcador.innerHTML = Object.keys(obj).map(function (k) { return "<span>" + esc(k) + " <b>" + esc(obj[k]) + "</b></span>"; }).join("");
      },
      terminar: function (puntos, resumen, estrellas) {
        if (limpiar) { limpiar(); limpiar = null; }
        var anterior = leerRecord(), nuevo = puntos > anterior;
        if (nuevo) guardarRecord(puntos);
        estrellas = Math.max(0, Math.min(3, estrellas || 0));
        marcador.innerHTML = "";
        escenario.innerHTML =
          '<div class="resultado">' +
            '<p class="estrellas-fin" aria-label="' + estrellas + ' de 3 estrellas">' +
              [0, 1, 2].map(function (i) { return '<span class="' + (i < estrellas ? "llena" : "") + '" style="--i:' + i + '">★</span>'; }).join("") +
            "</p>" +
            "<h3>" + (nuevo ? "¡Nuevo récord!" : estrellas === 3 ? "¡Perfecto!" : "¡Buen intento!") + "</h3>" +
            '<p class="puntos-fin">' + puntos + " <span>puntos</span></p>" +
            "<p>" + esc(resumen) + (anterior && !nuevo ? " Tu récord es " + anterior + "." : "") + "</p>" +
            '<button type="button" class="boton boton-principal boton-grande" id="otra-vez">Jugar otra vez</button>' +
          "</div>";
        document.getElementById("otra-vez").addEventListener("click", iniciar);
        if (estrellas === 3) MathKit.confeti(escenario);
      }
    });
  }
  iniciar();
})();`;

function pagina(r) {
  const juego = leer(`js/juegos/${r.id}.js`);
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(r.titulo)} · MathStore</title>
<meta name="author" content="${esc(r.autor)}">
<meta name="description" content="${esc(r.descripcion)}">
<link rel="icon" href="${logo}">
<!-- Fuentes: si no hay internet se usan las del sistema y el juego funciona igual -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap">
<style>
${css}
/* ---------- Página suelta del juego ---------- */
.juego-suelto { max-width: 1040px; margin: 0 auto; padding-block: 16px 28px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 14px; }
.juego-suelto .visor-cabecera { padding-right: 0; }
.juego-suelto .visor-cabecera img { width: 34px; height: 34px; }
.juego-suelto h1 { font-size: clamp(1.3rem, 3.5vw, 1.8rem); font-weight: 800; }
.pie-juego { text-align: center; color: var(--tiza-tenue); font-size: 0.85rem; margin: 0; }
.pie-juego b { color: var(--tiza); }
</style>
</head>
<body>
<!--
  ${r.titulo}: creado por ${r.autor} para MathStore.
  Archivo generado con "npm run exportar" (tools/exportar-juegos.mjs). Para cambiar el juego,
  edita js/juegos/${r.id}.js en el proyecto y vuelve a exportar.
-->
<main class="juego-suelto">
  <div class="visor-cabecera">
    <img src="${logo}" alt="">
    <h1>${esc(r.titulo)}</h1>
    <div class="marcador" id="marcador"></div>
    <button type="button" class="boton boton-secundario boton-sonido" id="boton-sonido" aria-pressed="true">Sonido: sí</button>
  </div>
  <div class="escenario" id="escenario"></div>
  <p class="pie-juego">Creado por <b>${esc(r.autor)}</b> · MathStore · ${esc(r.tema)}, ${esc(r.nivel)}</p>
</main>
<script>
${seguro(logica)}
</script>
<script>
${seguro(kit)}
</script>
<script>
${seguro(juego)}
</script>
<script>
${seguro(anfitrion(r.id))}
</script>
</body>
</html>
`;
}

mkdirSync("descargas", { recursive: true });
for (const id of JUEGOS) {
  const r = catalogo.find((x) => x.id === id);
  if (!r) throw new Error(`No está en el catálogo: ${id}`);
  if (!r.autor) throw new Error(`${id}: falta "autor" en el catálogo`);
  const html = pagina(r);
  writeFileSync(`descargas/${id}.html`, html);
  console.log(`descargas/${id}.html  (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
}
