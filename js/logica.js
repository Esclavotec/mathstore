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
  function generarMultiplicacion(azar, tablas) {
    // `tablas` (opcional) limita el primer factor, p. ej. [6, 7] para practicar solo esas tablas
    var a = tablas && tablas.length ? tablas[entero(0, tablas.length - 1, azar)] : entero(2, 10, azar);
    var b = entero(2, 10, azar);
    if ((azar || Math.random)() < 0.5) { var t = a; a = b; b = t; } // a veces 8 × 7, a veces 7 × 8
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

  /** Ángulo Ninja: puntos por ronda según el error en grados (100 si aciertas exacto, 0 si fallas por 50° o más). */
  function puntajeAngulo(real, estimado) {
    var error = Math.abs(real - estimado);
    return Math.max(0, Math.round(100 - error * 2));
  }

  /* ===== Carrera de Tablas ===== */

  /** Segundos que tarda el auto rival en llegar a la meta en cada nivel (1, 2, 3). */
  function segundosRival(nivel) { return [0, 55, 42, 32][nivel] || 32; }

  /** Avance del jugador (0–1) por respuesta: 10 aciertos llegan a la meta; con turbo (racha ≥ 3) se avanza 1,5 veces. */
  function avanceJugador(racha) { return racha >= 3 ? 0.15 : 0.1; }

  /* ===== Pizzería de Fracciones ===== */

  function mcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }
  function simplificar(n, d) { var m = mcd(n, d); return [n / m, d / m]; }

  /**
   * Un pedido: el cliente pide num/den de pizza y la pizza viene cortada en `porciones`.
   *  Nivel 1: la pizza se corta igual que el pedido (pide 3/4, pizza en 4).
   *  Nivel 2: pizza cortada en un múltiplo (pide 1/2, pizza en 4, 6 u 8): hay que pensar en equivalentes.
   *  Nivel 3: el pedido puede venir "sin simplificar" y la pizza en menos porciones (pide 6/8, pizza en 4).
   */
  function generarPedido(nivel, azar) {
    var dens = [2, 3, 4, 6, 8];
    var den = dens[entero(0, dens.length - 1, azar)], num = entero(1, den - 1, azar), porciones = den;
    // Las pizzas nunca tienen más de 12 porciones: más finas serían difíciles de tocar.
    var CORTES = [2, 3, 4, 6, 8, 12];
    if (nivel === 2) {
      var opciones;
      do {                                             // pedido simplificado (1/2, 2/3, 3/4…) y pizza en más partes
        den = [2, 3, 4, 6][entero(0, 3, azar)]; num = entero(1, den - 1, azar);
        var s = simplificar(num, den); num = s[0]; den = s[1];
        opciones = CORTES.filter(function (p) { return p % den === 0 && p > den; });
      } while (!opciones.length);
      porciones = opciones[entero(0, opciones.length - 1, azar)];
    } else if (nivel >= 3) {
      var base, opc, k;
      do {                                             // pedido "grande" (6/8, 4/6…) y pizza en menos partes
        den = [2, 3, 4][entero(0, 2, azar)]; num = entero(1, den - 1, azar);
        base = simplificar(num, den); k = entero(2, 3, azar);
        num = base[0] * k; den = base[1] * k;
        opc = CORTES.filter(function (p) { return p % base[1] === 0 && p < den; });
      } while (!opc.length);
      porciones = opc[entero(0, opc.length - 1, azar)];
    }
    return { num: num, den: den, porciones: porciones, necesarias: num * porciones / den };
  }

  /** ¿Las porciones elegidas forman exactamente num/den de la pizza? */
  function pedidoCorrecto(elegidas, porciones, num, den) { return elegidas * den === num * porciones; }

  /* ===== Ángulo Ninja ===== */

  /** Ángulo (0–180°) de un punto respecto al vértice; dy positivo hacia arriba. */
  function anguloDesde(dx, dy) {
    var g = Math.atan2(Math.max(dy, 0), dx) * 180 / Math.PI;
    return Math.max(0, Math.min(180, g));
  }

  /**
   * Linternas para los niveles 1 y 2: `cantidad` ángulos entre 15° y 165° separados al menos `separacion`
   * grados, y el índice de la que hay que cortar.
   */
  function generarLinternas(cantidad, separacion, azar) {
    var angs = [], intentos = 0;
    while (angs.length < cantidad && intentos++ < 500) {
      var a = entero(3, 33, azar) * 5; // múltiplos de 5 entre 15 y 165
      if (angs.every(function (b) { return Math.abs(a - b) >= separacion; })) angs.push(a);
    }
    angs.sort(function (x, y) { return x - y; });
    return { angulos: angs, objetivo: entero(0, angs.length - 1, azar) };
  }

  /** Índice de la linterna alcanzada al lanzar a `lanzado` grados (a ≤ `margen`°), o -1 si no toca ninguna. */
  function linternaAlcanzada(angulos, lanzado, margen) {
    var mejor = -1, dist = Infinity;
    angulos.forEach(function (a, i) { var d = Math.abs(a - lanzado); if (d <= margen && d < dist) { dist = d; mejor = i; } });
    return mejor;
  }

  /** Estrellas (0–3) según niveles superados. */
  function estrellas(nivelesSuperados) { return Math.max(0, Math.min(3, nivelesSuperados)); }

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
    compararFracciones: compararFracciones,
    puntajeAngulo: puntajeAngulo, tipoAngulo: tipoAngulo,
    segundosRival: segundosRival, avanceJugador: avanceJugador,
    mcd: mcd, simplificar: simplificar, generarPedido: generarPedido, pedidoCorrecto: pedidoCorrecto,
    anguloDesde: anguloDesde, generarLinternas: generarLinternas, linternaAlcanzada: linternaAlcanzada,
    estrellas: estrellas,
    normalizar: normalizar, filtrarCatalogo: filtrarCatalogo
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.MathLogica = api;
})(typeof window !== "undefined" ? window : this);
