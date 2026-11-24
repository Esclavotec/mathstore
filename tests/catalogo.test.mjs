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
  assert.ok(catalogo.length >= 8);
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
    if (r.tipo === "jugar") assert.ok(existsSync(raiz(`js/juegos/${r.url}.js`)), `${r.id}: falta js/juegos/${r.url}.js`);
    if (r.tipo === "descargar") {
      assert.ok(existsSync(raiz(r.url)), `${r.id}: falta ${r.url}`);
      assert.equal(readFileSync(raiz(r.url)).subarray(0, 5).toString(), "%PDF-", `${r.id}: no es un PDF`);
    }
    if (r.tipo === "web") assert.match(r.url, /^https:\/\//, `${r.id}: la web debe usar https`);
  }
});

test("hay los tres tipos de botón y al menos un destacado", () => {
  for (const t of TIPOS) assert.ok(catalogo.some((r) => r.tipo === t), `no hay recursos de tipo ${t}`);
  assert.ok(catalogo.some((r) => r.destacado));
});

test("generarMultiplicacion: 4 opciones distintas y una es la correcta", () => {
  for (let i = 0; i < 500; i++) {
    const p = L.generarMultiplicacion();
    assert.equal(p.correcta, p.a * p.b);
    assert.equal(p.opciones.length, 4);
    assert.equal(new Set(p.opciones).size, 4);
    assert.ok(p.opciones.includes(p.correcta));
    assert.ok(p.opciones.every((o) => o > 0));
  }
});

test("compararFracciones y generarParFracciones", () => {
  assert.equal(L.compararFracciones(1, 2, 2, 4), 0);
  assert.equal(L.compararFracciones(3, 4, 2, 3), 1);
  assert.equal(L.compararFracciones(1, 3, 1, 2), -1);
  for (let i = 0; i < 500; i++) {
    const p = L.generarParFracciones();
    assert.ok(p.a[0] < p.a[1] && p.b[0] < p.b[1], "fracciones propias");
    assert.equal(p.resultado, L.compararFracciones(p.a[0], p.a[1], p.b[0], p.b[1]));
  }
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
  assert.deepEqual(L.filtrarCatalogo(catalogo, { texto: "angulo" }).map((r) => r.id), ["angulo-ninja"]);
  assert.ok(L.filtrarCatalogo(catalogo, { tipo: "web" }).every((r) => r.tipo === "web"));
  const combinado = L.filtrarCatalogo(catalogo, { tema: "Aritmética", nivel: "primaria", tipo: "jugar" });
  assert.deepEqual(combinado.map((r) => r.id), ["carrera-tablas"]);
  assert.equal(L.filtrarCatalogo(catalogo, { texto: "zzz" }).length, 0);
  assert.equal(L.filtrarCatalogo(catalogo, {}).length, catalogo.length);
});
