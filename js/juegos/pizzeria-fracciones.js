/*
  Pizzería de Fracciones
  Creado por Antony Arias Valle para MathStore.
  Llegan clientes que piden una fracción de pizza ("Quiero 3/4"). La pizza ya está cortada:
  toca las porciones para servirlas y presiona "Servir".
  - Nivel 1: la pizza está cortada igual que el pedido (3/4 → pizza en 4).
  - Nivel 2: la pizza está cortada en más partes (1/2 → pizza en 6): fracciones equivalentes.
  - Nivel 3: pedidos sin simplificar y pizza en menos partes (6/8 → pizza en 4).
  - 4 clientes por nivel; cada uno tiene una barra de paciencia. Propina según lo rápido que sirvas.
  - 3 vidas (estrellas de reputación): un pedido mal servido o un cliente que se va resta una.
  Mismo contrato que el resto de juegos (ver carrera-tablas.js).
*/
(function () {
  "use strict";
  var L = window.MathLogica, K = window.MathKit;
  window.MathJuegos = window.MathJuegos || {};

  var CLIENTES_POR_NIVEL = 4;
  var PACIENCIA = [0, 30, 28, 26]; // segundos por cliente en cada nivel
  var PIELES = ["#f1c7a5", "#d9a07a", "#a86f4c", "#7a4a2e", "#f6d7bd"];
  var PELOS = ["#2b1d14", "#6b3e1f", "#d8a24a", "#b2452f", "#3a3a3a", "#7c5cbf"];
  var NOMBRES = ["Sofía", "Mateo", "Valentina", "Diego", "Camila", "Lucas", "Isabella", "Tomás", "Mariana", "Samuel", "Daniela", "Emilio"];

  /** Cara del cliente: humor = "normal" | "feliz" | "enojado". */
  function cara(c, humor) {
    var boca = humor === "feliz" ? '<path d="M38 66q12 12 24 0" stroke="#3b1f12" stroke-width="4" fill="none" stroke-linecap="round"/>'
      : humor === "enojado" ? '<path d="M38 72q12-10 24 0" stroke="#3b1f12" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M32 40l12 5M68 40l-12 5" stroke="#3b1f12" stroke-width="4" stroke-linecap="round"/>'
      : '<path d="M40 68h20" stroke="#3b1f12" stroke-width="4" stroke-linecap="round"/>';
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="50" cy="56" r="34" fill="' + c.piel + '"/>' +
      '<path d="M16 50c0-26 16-36 34-36s34 10 34 36c-8-10-20-14-34-14s-26 4-34 14z" fill="' + c.pelo + '"/>' +
      '<circle cx="38" cy="52" r="4.5" fill="#3b1f12"/><circle cx="62" cy="52" r="4.5" fill="#3b1f12"/>' +
      (humor === "feliz" ? '<circle cx="30" cy="64" r="5" fill="#ef8f9c" opacity=".6"/><circle cx="70" cy="64" r="5" fill="#ef8f9c" opacity=".6"/>' : '') +
      boca + '</svg>';
  }

  /** Pizza dibujada como porciones (cuñas) que se pueden tocar. */
  function pizza(porciones) {
    var s = '<svg class="pizza" viewBox="-110 -110 220 220" role="group" aria-label="Pizza cortada en ' + porciones + ' porciones">';
    s += '<circle r="106" fill="var(--tabla)"/><circle r="106" fill="none" stroke="var(--tabla-borde)" stroke-width="4"/>';
    for (var i = 0; i < porciones; i++) {
      var a0 = (i / porciones) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / porciones) * Math.PI * 2 - Math.PI / 2;
      var cuña = function (r) {
        return "M0 0L" + (Math.cos(a0) * r).toFixed(2) + " " + (Math.sin(a0) * r).toFixed(2) +
          "A" + r + " " + r + " 0 " + (a1 - a0 > Math.PI ? 1 : 0) + " 1 " + (Math.cos(a1) * r).toFixed(2) + " " + (Math.sin(a1) * r).toFixed(2) + "Z";
      };
      var am = (a0 + a1) / 2;
      // pepperoni: 1 o 2 por porción según su tamaño
      var pep = '<circle cx="' + (Math.cos(am) * 56).toFixed(1) + '" cy="' + (Math.sin(am) * 56).toFixed(1) + '" r="' + (porciones > 8 ? 7 : 9) + '" fill="#b8322e"/>';
      if (porciones <= 4) pep += '<circle cx="' + (Math.cos(am + 0.35) * 30).toFixed(1) + '" cy="' + (Math.sin(am + 0.35) * 30).toFixed(1) + '" r="7" fill="#b8322e"/>';
      var dx = (Math.cos(am) * 4).toFixed(2), dy = (Math.sin(am) * 4).toFixed(2);
      s += '<g class="porcion" data-i="' + i + '" tabindex="0" role="button" aria-pressed="false" aria-label="Porción ' + (i + 1) + '" style="--dx:' + dx + 'px;--dy:' + dy + 'px">' +
        '<path class="hueco" d="' + cuña(96) + '"/>' +
        '<g class="rebanada"><path d="' + cuña(96) + '" fill="#d9a35b"/><path d="' + cuña(84) + '" fill="#f5c84c"/>' + pep + '</g>' +
        '</g>';
    }
    return s + '</svg>';
  }

  function fraccionHTML(n, d) { return '<span class="frac"><span>' + n + '</span><span>' + d + '</span></span>'; }

  window.MathJuegos["pizzeria-fracciones"] = function (ctx) {
    var est = null, intervalo = 0, timeouts = [];
    function despues(ms, fn) { timeouts.push(setTimeout(fn, ms)); }
    function limpiar() { clearInterval(intervalo); timeouts.forEach(clearTimeout); timeouts = []; }

    function marcador() {
      ctx.marcador({ Nivel: est.nivel + "/3", Cliente: Math.min(est.cliente + 1, CLIENTES_POR_NIVEL) + "/" + CLIENTES_POR_NIVEL, Monedas: est.puntos, Reputación: K.corazones(est.vidas, 3) });
    }

    function inicio() {
      K.intro(ctx.escenario, {
        titulo: "Pizzería de Fracciones",
        subtitulo: "Sirve justo la fracción de pizza que te piden.",
        pasos: [
          "Lee el pedido del cliente, por ejemplo <b>3/4</b> de pizza.",
          "Toca las porciones para servirlas y presiona <b>Servir</b>.",
          "En el nivel 2 la pizza viene cortada en más partes, y en el nivel 3 en menos. Piensa en fracciones equivalentes.",
          "Si tardas demasiado, el cliente se va. Sirve rápido para ganar propina."
        ],
        boton: "Abrir la pizzería",
        autor: "Antony Arias Valle",
        alEmpezar: function () { est = { nivel: 1, cliente: 0, puntos: 0, vidas: 3, bien: 0, total: 0, nivelesOk: 0, fallosNivel: 0 }; montar(); nuevoCliente(); }
      });
      ctx.marcador({});
    }

    function montar() {
      ctx.escenario.innerHTML =
        '<div class="pizzeria">' +
          '<div class="mostrador">' +
            '<div class="cliente">' +
              '<div class="cliente-cara"></div>' +
              '<div class="globo"><span class="cliente-nombre"></span><div class="pedido"></div><div class="paciencia" aria-hidden="true"><i></i></div></div>' +
            '</div>' +
          '</div>' +
          '<div class="cocina">' +
            '<div class="pizza-caja"></div>' +
            '<p class="conteo" aria-live="polite"></p>' +
            '<p class="explicacion" aria-live="polite"></p>' +
            '<div class="acciones-pizza">' +
              '<button type="button" class="boton boton-secundario" data-vaciar>Vaciar</button>' +
              '<button type="button" class="boton boton-principal" data-servir>Servir</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      var raiz = ctx.escenario.querySelector(".pizzeria");
      raiz.addEventListener("click", function (e) {
        var p = e.target.closest(".porcion");
        if (p) return alternar(p);
        if (e.target.closest("[data-servir]")) return servir();
        if (e.target.closest("[data-vaciar]")) return vaciar();
      });
      raiz.addEventListener("keydown", function (e) {
        var p = e.target.closest(".porcion");
        if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); alternar(p); }
      });
    }

    function q(s) { return ctx.escenario.querySelector(s); }

    function nuevoCliente() {
      var c = {
        piel: PIELES[L.entero(0, PIELES.length - 1)], pelo: PELOS[L.entero(0, PELOS.length - 1)],
        nombre: NOMBRES[L.entero(0, NOMBRES.length - 1)], pedido: L.generarPedido(est.nivel)
      };
      est.c = c; est.elegidas = 0; est.atendiendo = true;
      est.limite = PACIENCIA[est.nivel]; est.inicio = performance.now();
      q(".cliente-cara").innerHTML = cara(c, "normal");
      q(".cliente-nombre").textContent = c.nombre + " pide:";
      q(".pedido").innerHTML = fraccionHTML(c.pedido.num, c.pedido.den) + '<span class="pedido-texto">de pizza</span>';
      q(".pizza-caja").innerHTML = pizza(c.pedido.porciones);
      q(".explicacion").textContent = "";
      q(".explicacion").className = "explicacion";
      var cli = q(".cliente"); cli.classList.remove("llega", "se-va"); void cli.offsetWidth; cli.classList.add("llega");
      q("[data-servir]").disabled = false; q("[data-vaciar]").disabled = false;
      actualizarConteo(); marcador();
      clearInterval(intervalo);
      intervalo = setInterval(tic, 100);
      tic();
    }

    function tic() {
      if (!est.atendiendo) return;
      var queda = Math.max(0, 1 - (performance.now() - est.inicio) / 1000 / est.limite);
      var barra = q(".paciencia i");
      barra.style.transform = "scaleX(" + queda + ")";
      barra.classList.toggle("poca", queda < 0.3);
      if (queda <= 0) resolver(false, true);
    }

    function actualizarConteo() {
      q(".conteo").textContent = "Porciones servidas: " + est.elegidas + " de " + est.c.pedido.porciones;
    }

    function alternar(p) {
      if (!est.atendiendo) return;
      var puesta = p.getAttribute("aria-pressed") !== "true";
      p.setAttribute("aria-pressed", puesta);
      p.classList.toggle("puesta", puesta);
      est.elegidas += puesta ? 1 : -1;
      K.sonido.tono(puesta ? 600 + est.elegidas * 40 : 400, 0.06, "triangle", 0.06);
      actualizarConteo();
    }

    function vaciar() {
      if (!est.atendiendo) return;
      ctx.escenario.querySelectorAll(".porcion").forEach(function (p) { p.classList.remove("puesta"); p.setAttribute("aria-pressed", "false"); });
      est.elegidas = 0; actualizarConteo();
    }

    function servir() {
      if (!est.atendiendo) return;
      resolver(L.pedidoCorrecto(est.elegidas, est.c.pedido.porciones, est.c.pedido.num, est.c.pedido.den), false);
    }

    function resolver(ok, seAburrio) {
      est.atendiendo = false; clearInterval(intervalo);
      q("[data-servir]").disabled = true; q("[data-vaciar]").disabled = true;
      var p = est.c.pedido, exp = q(".explicacion"), caja = q(".pizzeria");
      est.total++;
      var equivalente = p.num + "/" + p.den + " de pizza = " + p.necesarias + " de " + p.porciones + " porciones";
      if (ok) {
        var queda = Math.max(0, 1 - (performance.now() - est.inicio) / 1000 / est.limite);
        var propina = Math.round(queda * 10);
        est.puntos += 10 + propina; est.bien++;
        q(".cliente-cara").innerHTML = cara(est.c, "feliz");
        exp.textContent = "¡Perfecto! " + equivalente + "." + (propina ? " Propina: " + propina + " monedas." : "");
        exp.classList.add("bien");
        K.sonido.acierto();
        K.flotante(caja, "+" + (10 + propina), caja.clientWidth * 0.3, 40, "bien");
      } else {
        est.vidas--; est.fallosNivel++;
        q(".cliente-cara").innerHTML = cara(est.c, "enojado");
        exp.textContent = (seAburrio ? "Se cansó de esperar. " : "Ese pedido no era. Serviste " + est.elegidas + " porciones. ") + "Era: " + equivalente + ".";
        exp.classList.add("mal");
        K.sonido.error();
        caja.classList.remove("temblor"); void caja.offsetWidth; caja.classList.add("temblor");
      }
      marcador();
      despues(ok ? 1500 : 2600, siguiente);
    }

    function siguiente() {
      if (est.vidas <= 0) return fin();
      q(".cliente").classList.add("se-va");
      est.cliente++;
      if (est.cliente < CLIENTES_POR_NIVEL) return despues(260, nuevoCliente);
      // nivel terminado
      est.nivelesOk++;
      if (est.nivel >= 3) return fin();
      K.sonido.nivel(); K.confeti(ctx.escenario);
      var aviso = document.createElement("div");
      aviso.className = "aviso-nivel";
      aviso.innerHTML = "<h3>¡Nivel " + est.nivel + " completado!</h3><p>" +
        (est.nivel === 1 ? "Ahora la pizza viene cortada en más porciones: busca la fracción equivalente."
                         : "Último nivel: los pedidos vienen sin simplificar y la pizza en menos porciones.") + "</p>";
      var b = document.createElement("button");
      b.type = "button"; b.className = "boton boton-principal"; b.textContent = "Siguiente nivel";
      b.addEventListener("click", function () { aviso.remove(); est.nivel++; est.cliente = 0; est.fallosNivel = 0; nuevoCliente(); });
      aviso.appendChild(b);
      q(".pizzeria").appendChild(aviso);
      b.focus();
    }

    function fin() {
      limpiar();
      ctx.terminar(est.puntos,
        "Atendiste bien a " + est.bien + " de " + est.total + " clientes y completaste " + est.nivelesOk + " de 3 niveles.",
        L.estrellas(est.nivelesOk));
    }

    inicio();
    return limpiar;
  };
})();
