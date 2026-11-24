/*
  logica.js: funciones puras (sin DOM) que usan los juegos y la tienda.
  Funciona en el navegador (window.MathLogica) y en Node (module.exports),
  así los tests automáticos pueden comprobarlas sin abrir un navegador.
*/
(function (raiz) {
  "use strict";

  /** Entero aleatorio entre min y max (ambos incluidos). `azar` permite inyectar un generador en los tests. */
  function entero(min, max, azar) {
    var r = (azar || Math.random)();
    return min + Math.floor(r * (max - min + 1));
  }

  /** Mezcla una copia del arreglo (Fisher–Yates). */
  function mezclar(lista, azar) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = entero(0, i, azar);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /**
   * Carrera de Tablas: crea una multiplicación con 4 opciones distintas,
   * una correcta y tres distractores "creíbles" (vecinos en la tabla).
   */
  function generarMultiplicacion(azar) {
    var a = entero(2, 10, azar), b = entero(2, 10, azar);
    var correcta = a * b;
    var candidatos = [correcta + a, correcta - a, correcta + b, correcta - b, correcta + 1, correcta - 1, (a + 1) * (b + 1)];
    var opciones = [correcta];
    for (var i = 0; i < candidatos.length && opciones.length < 4; i++) {
      var c = candidatos[i];
      if (c > 0 && opciones.indexOf(c) === -1) opciones.push(c);
    }
    return { a: a, b: b, correcta: correcta, opciones: mezclar(opciones, azar) };
  }

  /** Compara dos fracciones n1/d1 y n2/d2 sin decimales: devuelve 1, -1 o 0. */
  function compararFracciones(n1, d1, n2, d2) {
    var izq = n1 * d2, der = n2 * d1;
    return izq > der ? 1 : izq < der ? -1 : 0;
  }

  /** Fracción Exacta: dos fracciones propias con denominador 2–12; a veces equivalentes. */
  function generarParFracciones(azar) {
    var d1 = entero(2, 12, azar), n1 = entero(1, d1 - 1, azar);
    var d2, n2;
    if ((azar || Math.random)() < 0.2) {
      // pareja equivalente (por ejemplo 2/3 y 4/6) para practicar "son iguales"
      var k = entero(2, 3, azar); n2 = n1 * k; d2 = d1 * k;
    } else {
      do { d2 = entero(2, 12, azar); n2 = entero(1, d2 - 1, azar); }
      while (compararFracciones(n1, d1, n2, d2) === 0);
    }
    return { a: [n1, d1], b: [n2, d2], resultado: compararFracciones(n1, d1, n2, d2) };
  }

  /** Ángulo Ninja: puntos por ronda según el error en grados (100 si aciertas exacto, 0 si fallas por 50° o más). */
  function puntajeAngulo(real, estimado) {
    var error = Math.abs(real - estimado);
    return Math.max(0, Math.round(100 - error * 2));
  }

  /** Clasifica un ángulo en grados con el nombre que se usa en clase. */
  function tipoAngulo(g) {
    if (g < 90) return "agudo";
    if (g === 90) return "recto";
    if (g < 180) return "obtuso";
    return "llano";
  }

  /**
   * Filtra el catálogo según búsqueda y filtros. La búsqueda ignora mayúsculas
   * y tildes y mira el título, la descripción, el tema y las etiquetas.
   */
  function normalizar(t) {
    return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function filtrarCatalogo(recursos, f) {
    f = f || {};
    var q = normalizar(f.texto).trim();
    return recursos.filter(function (r) {
      if (f.tema && r.tema !== f.tema) return false;
      if (f.tipo && r.tipo !== f.tipo) return false;
      if (f.nivel && r.nivel !== f.nivel) return false;
      if (!q) return true;
      var pajar = normalizar([r.titulo, r.descripcion, r.tema].concat(r.etiquetas || []).join(" "));
      return q.split(/\s+/).every(function (p) { return pajar.indexOf(p) !== -1; });
    });
  }

  var api = {
    entero: entero, mezclar: mezclar,
    generarMultiplicacion: generarMultiplicacion,
    compararFracciones: compararFracciones, generarParFracciones: generarParFracciones,
    puntajeAngulo: puntajeAngulo, tipoAngulo: tipoAngulo,
    normalizar: normalizar, filtrarCatalogo: filtrarCatalogo
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.MathLogica = api;
})(typeof window !== "undefined" ? window : this);
