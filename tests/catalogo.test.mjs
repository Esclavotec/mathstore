// Tests automáticos de MathStore. Uso: npm test  (o node --test tests/catalogo.test.mjs)
// Comprueban el catálogo (campos, tipos y que existan portadas, juegos y PDFs)
// y la lógica pura de los juegos (js/logica.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const L = require("../js/logica.js");
const catalogo = JSON.parse(readFileSync(new URL("../data/catalogo.json", import.meta.url), "utf8"));
const raiz = (p) => new URL("../" + p, import.meta.url);

const CAMPOS = ["id", "titulo", "portada", "descripcion", "tema", "nivel", "tipo", "url", "etiquetas"];
const TIPOS = ["jugar", "descargar", "web"];

test("el catálogo tiene recursos con todos los campos obligatorios", () => {
  assert.ok(catalogo.length >= 7);
  for (const r of catalogo) {
    for (const c of CAMPOS) assert.ok(r[c] !== undefined && r[c] !== "", `${r.id}: falta "${c}"`);
    assert.ok(TIPOS.includes(r.tipo), `${r.id}: tipo inválido "${r.tipo}"`);
    assert.ok(["primaria", "secundaria"].includes(r.nivel), `${r.id}: nivel inválido`);
    assert.match(r.id, /^[a-z0-9-]+$/, `${r.id}: el id solo puede tener minúsculas, números y guiones`);
  }
});

test("los ids no se repiten", () => {
  const ids = catalogo.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("cada portada existe", () => {
  for (const r of catalogo) assert.ok(existsSync(raiz(r.portada)), `${r.id}: no existe ${r.portada}`);
});

test("cada botón apunta a algo que existe", () => {
  for (const r of catalogo) {
    if (r.tipo === "jugar") {
      // juego propio (js/juegos/<id>.js) o juego HTML completo (games/.../index.html)
      const ruta = /.html?$/.test(r.url) ? r.url : `js/juegos/${r.url}.js`;
      assert.ok(existsSync(raiz(ruta)), `${r.id}: falta ${ruta}`);
      if (!/.html?$/.test(r.url)) assert.match(readFileSync(raiz("index.html"), "utf8"), new RegExp(`js/juegos/${r.url}\.js`), `${r.id}: index.html no carga su script`);
    }
    if (r.tipo === "descargar") {
      assert.ok(existsSync(raiz(r.url)), `${r.id}: falta ${r.url}`);
      assert.equal(readFileSync(raiz(r.url)).subarray(0, 5).toString(), "%PDF-", `${r.id}: no es un PDF`);
    }
    if (r.tipo === "web") assert.match(r.url, /^https:\/\//, `${r.id}: la web debe usar https`);
  }
});

test("ya no hay PDF y quedan juegos, enlaces y destacados", () => {
  assert.ok(!catalogo.some((r) => r.tipo === "descargar"), "los PDF se quitaron a propósito");
  assert.ok(!existsSync(raiz("material")), "la carpeta material/ ya no debe existir");
  for (const t of ["jugar", "web"]) assert.ok(catalogo.some((r) => r.tipo === t), `no hay recursos de tipo ${t}`);
  assert.ok(catalogo.some((r) => r.destacado));
});

test("La tiendita de los cuadriláteros está completa y con créditos", () => {
  const t = catalogo.find((r) => r.id === "tiendita-cuadrilateros");
  assert.ok(t, "falta en el catálogo");
  assert.equal(t.tipo, "jugar");
  assert.match(t.autor, /Antony Arias/);
  assert.match(t.autor, /José Pablo Calderón Gairaud/);
  const html = readFileSync(raiz(t.url), "utf8");
  assert.ok(html.includes("<title>Tiendita de cuadriláteros</title>"), "no es el juego esperado");
  assert.equal(readFileSync(raiz(t.portada)).subarray(8, 12).toString(), "WEBP");
});

test("generarMultiplicacion: 4 opciones distintas, una correcta y respeta las tablas elegidas", () => {
  for (let i = 0; i < 500; i++) {
    const p = L.generarMultiplicacion();
    assert.equal(p.correcta, p.a * p.b);
    assert.equal(p.opciones.length, 4);
    assert.equal(new Set(p.opciones).size, 4);
    assert.ok(p.opciones.includes(p.correcta));
    assert.ok(p.opciones.every((o) => o > 0));
    const q = L.generarMultiplicacion(null, [7]);
    assert.ok(q.a === 7 || q.b === 7, "con la tabla del 7, uno de los factores es 7");
  }
});

test("Carrera: el rival es más rápido en cada nivel y 10 aciertos llegan a la meta", () => {
  assert.ok(L.segundosRival(1) > L.segundosRival(2) && L.segundosRival(2) > L.segundosRival(3));
  assert.ok(Math.abs(L.avanceJugador(0) * 10 - 1) < 1e-9);
  assert.ok(L.avanceJugador(3) > L.avanceJugador(2), "el turbo avanza más");
});

test("Pizzería: los pedidos siempre se pueden servir con porciones enteras", () => {
  assert.deepEqual(L.simplificar(6, 8), [3, 4]);
  assert.ok(L.pedidoCorrecto(3, 6, 1, 2));
  assert.ok(L.pedidoCorrecto(3, 4, 6, 8));
  assert.ok(!L.pedidoCorrecto(2, 4, 3, 4));
  for (const nivel of [1, 2, 3]) {
    for (let i = 0; i < 500; i++) {
      const p = L.generarPedido(nivel);
      assert.ok(p.num > 0 && p.num < p.den, `nivel ${nivel}: fracción propia (${p.num}/${p.den})`);
      assert.ok(Number.isInteger(p.necesarias) && p.necesarias > 0 && p.necesarias < p.porciones, `nivel ${nivel}: ${p.num}/${p.den} en ${p.porciones}`);
      assert.ok(L.pedidoCorrecto(p.necesarias, p.porciones, p.num, p.den));
      if (nivel === 1) assert.equal(p.porciones, p.den);
      if (nivel === 2) assert.ok(p.porciones > p.den, "nivel 2: pizza cortada en más partes");
      if (nivel === 3) assert.ok(p.porciones < p.den, "nivel 3: pizza cortada en menos partes");
      assert.ok(p.porciones <= 12, "nunca más de 12 porciones");
    }
  }
});

test("Ángulo Ninja: linternas separadas, impactos y ángulo desde un punto", () => {
  for (const [n, sep] of [[3, 40], [4, 22]]) {
    for (let i = 0; i < 300; i++) {
      const g = L.generarLinternas(n, sep);
      assert.equal(g.angulos.length, n);
      g.angulos.forEach((a, j) => { assert.ok(a >= 15 && a <= 165); if (j) assert.ok(a - g.angulos[j - 1] >= sep); });
      assert.ok(g.objetivo >= 0 && g.objetivo < n);
    }
  }
  assert.equal(L.linternaAlcanzada([30, 90, 150], 95, 9), 1);
  assert.equal(L.linternaAlcanzada([30, 90, 150], 60, 9), -1);
  assert.equal(L.anguloDesde(1, 0), 0);
  assert.equal(Math.round(L.anguloDesde(0, 1)), 90);
  assert.equal(L.anguloDesde(-1, 0), 180);
  assert.equal(L.anguloDesde(1, -1), 0, "por debajo del suelo cuenta como 0°");
});

test("puntajeAngulo y tipoAngulo", () => {
  assert.equal(L.puntajeAngulo(45, 45), 100);
  assert.equal(L.puntajeAngulo(45, 55), 80);
  assert.equal(L.puntajeAngulo(10, 170), 0);
  assert.equal(L.tipoAngulo(30), "agudo");
  assert.equal(L.tipoAngulo(90), "recto");
  assert.equal(L.tipoAngulo(120), "obtuso");
});

test("filtrarCatalogo: búsqueda sin tildes y filtros combinados", () => {
  assert.ok(L.filtrarCatalogo(catalogo, { texto: "angulo" }).length >= 2, "sin tilde encuentra «ángulos»");
  assert.deepEqual(L.filtrarCatalogo(catalogo, { texto: "angulo ninja" }).map((r) => r.id), ["angulo-ninja"]);
  assert.ok(L.filtrarCatalogo(catalogo, { tipo: "web" }).every((r) => r.tipo === "web"));
  const combinado = L.filtrarCatalogo(catalogo, { tema: "Aritmética", nivel: "primaria", tipo: "jugar" });
  assert.deepEqual(combinado.map((r) => r.id), ["carrera-tablas"]);
  assert.equal(L.filtrarCatalogo(catalogo, { texto: "zzz" }).length, 0);
  assert.equal(L.filtrarCatalogo(catalogo, {}).length, catalogo.length);
});

test("La tiendita tiene 2 versiones: el original de GeoGebra y la renovada", () => {
  const t = catalogo.find((r) => r.id === "tiendita-cuadrilateros");
  assert.equal(t.versiones.length, 2);
  const [original, renovada] = t.versiones;
  assert.equal(original.id, "original");
  assert.equal(original.url, "https://www.geogebra.org/material/iframe/id/hj3bdkta", "visor oficial de GeoGebra para incrustar");
  assert.equal(original.enlace, "https://www.geogebra.org/m/hj3bdkta", "enlace directo a la actividad");
  assert.match(original.autor, /José Pablo Calderón Gairaud/);
  assert.equal(renovada.id, "renovada");
  assert.match(renovada.autor, /Antony Arias/);
  assert.ok(existsSync(raiz(renovada.url)), "falta el juego renovado");
  for (const v of t.versiones) {
    for (const c of ["id", "nombre", "etiqueta", "portada", "autor", "url"]) assert.ok(v[c], `versión ${v.id}: falta "${c}"`);
    assert.ok(existsSync(raiz(v.portada)), `versión ${v.id}: no existe ${v.portada}`);
  }
});

test("Los 3 juegos propios llevan a Antony Arias Valle como creador", () => {
  for (const id of ["carrera-tablas", "pizzeria-fracciones", "angulo-ninja"]) {
    assert.equal(catalogo.find((r) => r.id === id).autor, "Antony Arias Valle", `${id}: falta el creador en el catálogo`);
    assert.match(readFileSync(raiz(`js/juegos/${id}.js`), "utf8"), /autor: "Antony Arias Valle"/, `${id}: falta «Creado por» en la pantalla de inicio`);
  }
});

test("Los HTML sueltos existen, son autosuficientes y llevan el nombre del creador", () => {
  for (const id of ["carrera-tablas", "pizzeria-fracciones", "angulo-ninja"]) {
    const ruta = raiz(`descargas/${id}.html`);
    assert.ok(existsSync(ruta), `falta descargas/${id}.html (ejecuta npm run exportar)`);
    const html = readFileSync(ruta, "utf8");
    assert.match(html, /<meta name="author" content="Antony Arias Valle">/);
    assert.match(html, /Creado por <b>Antony Arias Valle<\/b>/);
    assert.ok(html.includes(`window.MathJuegos["${id}"]`), `${id}: no trae el código del juego`);
    assert.ok(html.includes("window.MathKit") && html.includes("MathLogica"), `${id}: no trae el kit o la lógica`);
    // autosuficiente: ningún <script src> ni hoja de estilos local; solo la fuente opcional de Google
    assert.ok(!/<script[^>]+src=/.test(html), `${id}: carga scripts externos`);
    const hojas = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(hojas.every((h) => h.startsWith("https://fonts.googleapis.com/")), `${id}: depende de otra hoja de estilos`);
    // está al día con el código fuente del juego
    assert.ok(html.includes(readFileSync(raiz(`js/juegos/${id}.js`), "utf8").split("\n").slice(-5).join("\n").trim().slice(0, 40)), `${id}: el HTML está desactualizado (ejecuta npm run exportar)`);
  }
});
