/*
  Fracción Exacta: 10 rondas. En cada una se elige la fracción mayor o "son iguales".
  Cada fracción se dibuja también como una barra para ver la cantidad.
  Puntos: 10 por acierto + bonus por rapidez (hasta 5 si respondes en menos de 5 s).
  Mismo contrato que el resto de juegos (ver carrera-tablas.js).
*/
(function () {
  "use strict";
  var L = window.MathLogica;
  window.MathJuegos = window.MathJuegos || {};

  /** Barra SVG dividida en d partes con n coloreadas. */
  function barraFraccion(n, d) {
    var w = 140, h = 22, s = "";
    for (var i = 0; i < d; i++) {
      s += '<rect x="' + (i * w / d + 1) + '" y="1" width="' + (w / d - 2) + '" height="' + (h - 2) +
        '" rx="2" fill="' + (i < n ? "var(--tiza-amarilla)" : "var(--linea)") + '"/>';
    }
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true">' + s + "</svg>";
  }

  window.MathJuegos["fraccion-exacta"] = function (ctx) {
    var RONDAS = 10;
    var ronda = 0, puntos = 0, aciertos = 0, inicioRonda = 0, inicioJuego = performance.now(), reloj, espera;

    function marcador() {
      var seg = Math.floor((performance.now() - inicioJuego) / 1000);
      ctx.marcador({ Ronda: Math.min(ronda + 1, RONDAS) + "/" + RONDAS, Puntos: puntos, Tiempo: seg + " s" });
    }

    function botonFraccion(f, valor, etiqueta) {
      return '<button type="button" class="fraccion-btn" data-valor="' + valor + '" aria-label="' + etiqueta + '">' +
        (f ? '<span class="fraccion-num"><span>' + f[0] + '</span><hr><span>' + f[1] + "</span></span>" + barraFraccion(f[0], f[1])
           : '<span class="fraccion-num" style="font-size:1.4rem">=</span><span>Son iguales</span>') +
        "</button>";
    }

    function nueva() {
      var par = L.generarParFracciones();
      inicioRonda = performance.now();
      ctx.escenario.innerHTML =
        '<p style="margin:0;color:var(--tiza-tenue)">¿Cuál es mayor?</p>' +
        '<div class="fracciones">' +
          botonFraccion(par.a, 1, par.a[0] + " de " + par.a[1]) +
          botonFraccion(null, 0, "Son iguales") +
          botonFraccion(par.b, -1, par.b[0] + " de " + par.b[1]) +
        "</div>";
      ctx.escenario.querySelectorAll(".fraccion-btn").forEach(function (b) {
        b.addEventListener("click", function () { responder(b, +b.dataset.valor, par); }, { once: true });
      });
    }

    function responder(boton, valor, par) {
      ctx.escenario.querySelectorAll(".fraccion-btn").forEach(function (b) {
        b.disabled = true;
        if (+b.dataset.valor === par.resultado) b.classList.add("bien");
      });
      if (valor === par.resultado) {
        aciertos++;
        var seg = (performance.now() - inicioRonda) / 1000;
        puntos += 10 + Math.max(0, Math.round(5 - seg));
      } else {
        boton.classList.add("mal");
      }
      ronda++;
      marcador();
      espera = setTimeout(function () {
        if (ronda >= RONDAS) {
          clearInterval(reloj);
          var total = Math.round((performance.now() - inicioJuego) / 1000);
          ctx.terminar(puntos, aciertos + " de " + RONDAS + " correctas en " + total + " segundos.");
        } else nueva();
      }, 800);
    }

    nueva();
    marcador();
    reloj = setInterval(marcador, 500);
    return function limpiar() { clearInterval(reloj); clearTimeout(espera); };
  };
})();
