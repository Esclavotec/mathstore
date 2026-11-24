/*
  Carrera de Tablas: 60 segundos para resolver todas las multiplicaciones posibles.
  +10 puntos por acierto y +2 extra por cada acierto seguido (racha).

  Contrato de todos los juegos (lo usa app.js):
    window.MathJuegos[id] = function (ctx) { ...; return limpiar; }
    ctx.escenario      → elemento donde se dibuja el juego
    ctx.marcador(obj)  → actualiza el marcador superior, p. ej. { Puntos: 30, Tiempo: "42 s" }
    ctx.terminar(puntos, resumen) → muestra la pantalla final (y guarda el récord)
    limpiar()          → la llama app.js al cerrar, para parar temporizadores
*/
(function () {
  "use strict";
  var L = window.MathLogica;
  window.MathJuegos = window.MathJuegos || {};

  window.MathJuegos["carrera-tablas"] = function (ctx) {
    var DURACION = 60;
    var puntos = 0, racha = 0, aciertos = 0, fallos = 0, bloqueado = false;
    var inicio = performance.now(), reloj;

    ctx.escenario.innerHTML =
      '<div class="barra-tiempo" aria-hidden="true"><i></i></div>' +
      '<div class="pregunta" aria-live="polite"></div>' +
      '<div class="opciones"></div>';
    var barra = ctx.escenario.querySelector(".barra-tiempo i");
    var pregunta = ctx.escenario.querySelector(".pregunta");
    var opciones = ctx.escenario.querySelector(".opciones");

    function actualizarMarcador(restante) {
      ctx.marcador({ Puntos: puntos, Racha: racha, Tiempo: Math.ceil(restante) + " s" });
    }

    function nueva() {
      var p = L.generarMultiplicacion();
      pregunta.textContent = p.a + " × " + p.b;
      opciones.innerHTML = "";
      p.opciones.forEach(function (valor) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "opcion"; b.textContent = valor;
        b.addEventListener("click", function () { responder(b, valor === p.correcta, p); });
        opciones.appendChild(b);
      });
      bloqueado = false;
    }

    function responder(boton, bien, p) {
      if (bloqueado) return;
      bloqueado = true;
      if (bien) { racha++; aciertos++; puntos += 10 + (racha - 1) * 2; boton.classList.add("bien"); }
      else {
        racha = 0; fallos++; boton.classList.add("mal");
        // marca también la correcta para que se aprenda del error
        opciones.querySelectorAll(".opcion").forEach(function (o) { if (+o.textContent === p.correcta) o.classList.add("bien"); });
      }
      setTimeout(nueva, bien ? 250 : 700);
    }

    function tic() {
      var restante = Math.max(0, DURACION - (performance.now() - inicio) / 1000);
      barra.style.transform = "scaleX(" + restante / DURACION + ")";
      actualizarMarcador(restante);
      if (restante <= 0) {
        clearInterval(reloj);
        ctx.terminar(puntos, aciertos + " aciertos y " + fallos + " fallos en " + DURACION + " segundos.");
      }
    }

    nueva();
    tic();
    reloj = setInterval(tic, 100);
    return function limpiar() { clearInterval(reloj); };
  };
})();
