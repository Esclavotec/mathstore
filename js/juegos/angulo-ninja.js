/*
  Ángulo Ninja: 5 rondas. Se dibuja un ángulo y hay que estimar cuántos grados mide
  con el deslizador. Puntos por ronda: 100 − 2 × error en grados (mínimo 0).
  Tras cada ronda se muestra el ángulo real y si es agudo, recto u obtuso.
  Mismo contrato que el resto de juegos (ver carrera-tablas.js).
*/
(function () {
  "use strict";
  var L = window.MathLogica;
  window.MathJuegos = window.MathJuegos || {};

  window.MathJuegos["angulo-ninja"] = function (ctx) {
    var RONDAS = 5;
    var ronda = 0, puntos = 0, errores = [], real = 0, inicio = performance.now(), reloj, espera;

    ctx.escenario.innerHTML =
      '<canvas class="angulo-lienzo" width="720" height="720" role="img" aria-label="Ángulo a estimar"></canvas>' +
      '<div class="deslizador">' +
        '<label for="estimacion" style="color:var(--tiza-tenue)">Tu estimación</label>' +
        '<output id="estimacion-valor">90°</output>' +
        '<input id="estimacion" type="range" min="1" max="179" value="90">' +
      "</div>" +
      '<p id="angulo-feedback" style="margin:0;min-height:1.5em;color:var(--tiza-tenue)" aria-live="polite"></p>' +
      '<button class="boton boton-principal" type="button" id="angulo-ok">Comprobar</button>';

    var lienzo = ctx.escenario.querySelector("canvas");
    var g = lienzo.getContext("2d");
    var rango = ctx.escenario.querySelector("#estimacion");
    var salida = ctx.escenario.querySelector("#estimacion-valor");
    var feedback = ctx.escenario.querySelector("#angulo-feedback");
    var ok = ctx.escenario.querySelector("#angulo-ok");
    var css = getComputedStyle(document.documentElement);
    var colTiza = css.getPropertyValue("--tiza").trim() || "#e9efe9";
    var colAcento = css.getPropertyValue("--tiza-amarilla").trim() || "#f2cf5b";
    var colLinea = css.getPropertyValue("--linea").trim() || "#2f4a3f";
    var colVerde = css.getPropertyValue("--tiza-verde").trim() || "#8fdc9e";

    /** Dibuja el ángulo `grados`; si `estimado` existe, dibuja también la estimación punteada. */
    function dibujar(grados, estimado) {
      var cy = 470, ox = 360; // vértice centrado: caben agudos y obtusos
      var rad = grados * Math.PI / 180;
      g.clearRect(0, 0, 720, 720);
      g.lineCap = "round";
      // cuadrícula de fondo
      g.strokeStyle = colLinea; g.lineWidth = 2;
      for (var i = 0; i <= 720; i += 40) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 720); g.moveTo(0, i); g.lineTo(720, i); g.stroke(); }
      g.strokeStyle = colTiza; g.lineWidth = 10;
      g.beginPath(); g.moveTo(ox, cy); g.lineTo(ox + 310, cy); g.stroke();
      g.beginPath(); g.moveTo(ox, cy); g.lineTo(ox + Math.cos(rad) * 300, cy - Math.sin(rad) * 300); g.stroke();
      // arco
      g.strokeStyle = colAcento; g.lineWidth = 6;
      g.beginPath(); g.arc(ox, cy, 90, -rad, 0); g.stroke();
      if (estimado != null) {
        var re = estimado * Math.PI / 180;
        g.setLineDash([18, 14]); g.strokeStyle = colVerde; g.lineWidth = 6;
        g.beginPath(); g.moveTo(ox, cy); g.lineTo(ox + Math.cos(re) * 280, cy - Math.sin(re) * 280); g.stroke();
        g.setLineDash([]);
      }
      g.fillStyle = colTiza; g.beginPath(); g.arc(ox, cy, 12, 0, Math.PI * 2); g.fill();
    }

    function marcador() {
      ctx.marcador({ Ronda: Math.min(ronda + 1, RONDAS) + "/" + RONDAS, Puntos: puntos, Tiempo: Math.floor((performance.now() - inicio) / 1000) + " s" });
    }

    function nueva() {
      real = L.entero(10, 170);
      rango.value = 90; salida.textContent = "90°";
      feedback.textContent = "";
      ok.textContent = "Comprobar"; ok.dataset.fase = "comprobar";
      rango.disabled = false;
      dibujar(real);
    }

    rango.addEventListener("input", function () { salida.textContent = rango.value + "°"; });
    ok.addEventListener("click", function () {
      if (ok.dataset.fase === "comprobar") {
        var est = +rango.value, gana = L.puntajeAngulo(real, est);
        puntos += gana; errores.push(Math.abs(real - est));
        dibujar(real, est);
        feedback.innerHTML = "Medía <b>" + real + "°</b> (" + L.tipoAngulo(real) + "). Te desviaste " + Math.abs(real - est) + "° → +" + gana + " puntos.";
        rango.disabled = true;
        ronda++;
        marcador();
        ok.textContent = ronda >= RONDAS ? "Ver resultado" : "Siguiente ángulo";
        ok.dataset.fase = "siguiente";
      } else if (ronda >= RONDAS) {
        clearInterval(reloj);
        var media = Math.round(errores.reduce(function (a, b) { return a + b; }, 0) / errores.length);
        ctx.terminar(puntos, "Error medio de " + media + "° en " + RONDAS + " ángulos.");
      } else nueva();
    });

    nueva();
    marcador();
    reloj = setInterval(marcador, 500);
    return function limpiar() { clearInterval(reloj); clearTimeout(espera); };
  };
})();
