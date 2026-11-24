// Genera las fichas imprimibles en PDF de material/ sin librerías externas.
// Uso: node tools/generar-pdfs.mjs
// Escribe un PDF mínimo (fuente Helvetica, texto en WinAnsi para las tildes).
// Los ejercicios usan una semilla fija, así cada ejecución produce las mismas fichas.
import { writeFileSync, mkdirSync } from "node:fs";

/** Generador pseudoaleatorio con semilla (mulberry32). */
function azar(semilla) {
  return () => {
    semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ent = (r, a, b) => a + Math.floor(r() * (b - a + 1));

/** Escapa texto para un literal PDF y lo pasa a latin1 (WinAnsi). */
const lit = (t) => "(" + t.replace(/[\\()]/g, (c) => "\\" + c).replace(/−/g, "-").replace(/×/g, "x") + ")";

/** Crea un PDF de varias páginas A4. paginas = [[{x, y, tam, texto, negrita}], ...] */
function crearPdf(paginas) {
  const objs = [];
  const add = (s) => { objs.push(s); return objs.length; };
  const fuente = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const fuenteN = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const idPaginas = objs.length + 1 + paginas.length * 2; // se reserva al final
  const kids = [];
  for (const items of paginas) {
    let flujo = "";
    for (const it of items) {
      if (it.linea) { flujo += `0.6 w ${it.linea.join(" ")} m ${it.hasta.join(" ")} l S\n`; continue; }
      flujo += `BT /${it.negrita ? "F2" : "F1"} ${it.tam || 12} Tf ${it.x} ${it.y} Td ${lit(it.texto)} Tj ET\n`;
    }
    const cont = add(`<< /Length ${Buffer.byteLength(flujo, "latin1")} >>\nstream\n${flujo}endstream`);
    kids.push(add(`<< /Type /Page /Parent ${idPaginas} 0 R /MediaBox [0 0 595 842] /Contents ${cont} 0 R /Resources << /Font << /F1 ${fuente} 0 R /F2 ${fuenteN} 0 R >> >> >>`));
  }
  add(`<< /Type /Pages /Kids [${kids.map((k) => k + " 0 R").join(" ")}] /Count ${kids.length} >>`);
  const catalogo = add(`<< /Type /Catalog /Pages ${idPaginas} 0 R >>`);
  let pdf = "%PDF-1.4\n";
  const offs = [];
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(pdf, "latin1")); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root ${catalogo} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

const cabecera = (titulo, sub) => [
  { x: 50, y: 790, tam: 22, negrita: true, texto: titulo },
  { x: 50, y: 770, tam: 11, texto: sub },
  { x: 50, y: 745, tam: 11, texto: "Nombre: ______________________________   Fecha: ____________" },
  { linea: [50, 735], hasta: [545, 735] }
];

/* ---------- Sumas y restas: 3 páginas de 16 ejercicios + soluciones ---------- */
function fichaSumasRestas() {
  const r = azar(2026), paginas = [], soluciones = [];
  for (let p = 0; p < 3; p++) {
    const items = cabecera(`Sumas y restas · Ficha ${p + 1}`, "Resuelve en tu cuaderno. Hay llevadas: ¡revisa cada columna!");
    for (let i = 0; i < 16; i++) {
      let a = ent(r, 100, 899), b = ent(r, 25, 499); const suma = r() < 0.5 || a < b;
      if (!suma && a < b) [a, b] = [b, a];
      const n = p * 16 + i + 1, col = i % 2, fila = Math.floor(i / 2);
      const op = `${n}.   ${a} ${suma ? "+" : "-"} ${b} = ________`;
      items.push({ x: 60 + col * 260, y: 700 - fila * 80, tam: 15, texto: op });
      soluciones.push(`${n}. ${suma ? a + b : a - b}`);
    }
    items.push({ x: 50, y: 40, tam: 9, texto: "MathStore · material didáctico de matemáticas" });
    paginas.push(items);
  }
  const sol = cabecera("Soluciones", "Sumas y restas · fichas 1 a 3");
  soluciones.forEach((s, i) => sol.push({ x: 60 + (i % 4) * 125, y: 700 - Math.floor(i / 4) * 28, tam: 12, texto: s }));
  paginas.push(sol);
  return crearPdf(paginas);
}

/* ---------- Ecuaciones de primer grado: 20 ejercicios en 4 bloques ---------- */
function fichaEcuaciones() {
  const r = azar(1203), items = cabecera("Ecuaciones de primer grado", "Despeja x. Los ejercicios van de menor a mayor dificultad."), sol = [];
  const bloques = [
    ["A. x + a = b", () => { const x = ent(r, 1, 15), a = ent(r, 2, 20); return [`x + ${a} = ${x + a}`, x]; }],
    ["B. ax = b", () => { const x = ent(r, 2, 12), a = ent(r, 2, 9); return [`${a}x = ${a * x}`, x]; }],
    ["C. ax + b = c", () => { const x = ent(r, 1, 10), a = ent(r, 2, 7), b = ent(r, 1, 15); return [`${a}x + ${b} = ${a * x + b}`, x]; }],
    ["D. Con paréntesis", () => { const x = ent(r, 1, 9), a = ent(r, 2, 5), b = ent(r, 1, 6), c = ent(r, 1, 9); return [`${a}(x + ${b}) - ${c} = ${a * (x + b) - c}`, x]; }]
  ];
  let y = 705, n = 1;
  for (const [titulo, gen] of bloques) {
    items.push({ x: 50, y, tam: 13, negrita: true, texto: titulo }); y -= 30;
    for (let i = 0; i < 5; i++) {
      const [ec, x] = gen();
      items.push({ x: 70 + (i % 2) * 250, y: y - Math.floor(i / 2) * 34, tam: 14, texto: `${n}.  ${ec}` });
      sol.push(`${n}. x = ${x}`); n++;
    }
    y -= 34 * 3 + 12;
  }
  items.push({ x: 50, y: 40, tam: 9, texto: "MathStore · material didáctico de matemáticas" });
  const pagSol = cabecera("Soluciones", "Ecuaciones de primer grado");
  sol.forEach((s, i) => pagSol.push({ x: 60 + (i % 4) * 125, y: 700 - Math.floor(i / 4) * 28, tam: 12, texto: s }));
  return crearPdf([items, pagSol]);
}

mkdirSync("material", { recursive: true });
writeFileSync("material/fichas-sumas-restas.pdf", fichaSumasRestas());
writeFileSync("material/fichas-ecuaciones.pdf", fichaEcuaciones());
console.log("PDFs generados en material/");
