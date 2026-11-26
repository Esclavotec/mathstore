/*
  Carrera de Tablas (v2)
  Creado por Antony Arias Valle para MathStore.
  Tu auto avanza con cada multiplicación correcta; el rival avanza solo, cada vez más rápido.
  - 3 carreras (niveles). Ganas una carrera si llegas a la meta antes que el rival.
  - 10 aciertos llegan a la meta. Con 3 aciertos seguidos se activa el TURBO (avanzas más).
  - 3 vidas para toda la partida: cada error quita una y tu auto derrapa.
  - Puntos: 10 por acierto (+5 con turbo) y un bono por la ventaja con la que cruzas la meta.
  - Se responde tocando una opción o con las teclas 1–4.

  Contrato de todos los juegos (lo usa app.js):
    window.MathJuegos[id] = function (ctx) { ...; return limpiar; }
    ctx.escenario      → elemento donde se dibuja el juego
    ctx.marcador(obj)  → actualiza el marcador superior, p. ej. { Puntos: 30, Vidas: "♥♥♡" }
    ctx.terminar(puntos, resumen, estrellas) → pantalla final (guarda el récord)
    limpiar()          → la llama app.js al cerrar, para parar bucles y escuchas
*/
(function () {
  "use strict";
  var L = window.MathLogica, K = window.MathKit;
  window.MathJuegos = window.MathJuegos || {};

  /** Auto visto de lado, mirando a la derecha. */
  function auto(carroceria, cabina) {
    return '<svg viewBox="0 0 120 56" aria-hidden="true">' +
      '<path d="M8 38c0-8 6-12 14-13l18-2 14-12c3-3 7-4 11-4h17c5 0 9 2 12 6l8 10 8 2c4 1 6 4 6 8v5c0 2-2 4-4 4H12c-2 0-4-2-4-4z" fill="' + carroceria + '"/>' +
      '<path d="M48 22l10-9c2-2 4-3 7-3h14c3 0 5 1 7 4l6 8z" fill="' + cabina + '"/>' +
      '<rect x="100" y="27" width="10" height="5" rx="2" fill="#fff6c8"/>' +
      '<circle cx="32" cy="46" r="9" fill="#111"/><circle cx="32" cy="46" r="4" fill="#9aa"/>' +
      '<circle cx="92" cy="46" r="9" fill="#111"/><circle cx="92" cy="46" r="4" fill="#9aa"/>' +
      '</svg>';
  }

  window.MathJuegos["carrera-tablas"] = function (ctx) {
    var tablasElegidas = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    var raf = 0, timeouts = [], alTeclear = null;
    var estado = null;

    function despues(ms, fn) { timeouts.push(setTimeout(fn, ms)); }
    function limpiar() {
      cancelAnimationFrame(raf);
      timeouts.forEach(clearTimeout); timeouts = [];
      if (alTeclear) document.removeEventListener("keydown", alTeclear);
    }

    /* ---------- Pantalla de inicio con selector de tablas ---------- */
    function pantallaInicio() {
      var chips = "";
      for (var t = 2; t <= 10; t++) chips += '<button type="button" class="chip-tabla" data-t="' + t + '" aria-pressed="' + (tablasElegidas.indexOf(t) !== -1) + '">' + t + '</button>';
      K.intro(ctx.escenario, {
        titulo: "Carrera de Tablas",
        subtitulo: "Gana 3 carreras resolviendo multiplicaciones.",
        pasos: [
          "Cada respuesta correcta hace avanzar tu auto amarillo.",
          "El auto azul avanza solo, y en cada carrera va más rápido.",
          "Con 3 aciertos seguidos se activa el <b>turbo</b>.",
          "Tienes 3 vidas. Puedes responder con las teclas 1, 2, 3 y 4."
        ],
        extra: '<div class="selector-tablas"><span>Tablas a practicar</span><div>' + chips + '</div></div>',
        boton: "¡Arrancar!",
        autor: "Antony Arias Valle",
        alEmpezar: function () { empezarPartida(); }
      });
      ctx.escenario.querySelectorAll(".chip-tabla").forEach(function (b) {
        b.addEventListener("click", function () {
          var t = +b.dataset.t, i = tablasElegidas.indexOf(t);
          if (i !== -1 && tablasElegidas.length > 1) tablasElegidas.splice(i, 1);
          else if (i === -1) tablasElegidas.push(t);
          b.setAttribute("aria-pressed", tablasElegidas.indexOf(t) !== -1);
          K.sonido.toque();
        });
      });
      ctx.marcador({});
    }

    /* ---------- Partida ---------- */
    function empezarPartida() {
      estado = { nivel: 1, puntos: 0, vidas: 3, aciertos: 0, fallos: 0, ganadas: 0 };
      empezarCarrera();
    }

    function marcador() {
      ctx.marcador({ Carrera: estado.nivel + "/3", Puntos: estado.puntos, Vidas: K.corazones(estado.vidas, 3) });
    }

    function empezarCarrera() {
      estado.p = 0; estado.r = 0; estado.racha = 0; estado.activa = false; estado.bloqueo = false;
      ctx.escenario.innerHTML =
        '<div class="carrera">' +
          '<div class="pista" aria-hidden="true">' +
            '<div class="carril"><span class="carril-nombre">Tú</span><div class="auto auto-jugador">' + auto("#f2cf5b", "#14211d") + '<i class="turbo-fuego"></i></div></div>' +
            '<div class="carril"><span class="carril-nombre">Rival</span><div class="auto auto-rival">' + auto("#7cc4e8", "#14211d") + '</div></div>' +
            '<div class="linea-meta"></div>' +
          '</div>' +
          '<div class="carrera-centro">' +
            '<div class="cuenta" aria-live="assertive"></div>' +
            '<div class="pregunta" aria-live="polite"></div>' +
            '<div class="estado-turbo" aria-live="polite"></div>' +
            '<div class="opciones"></div>' +
          '</div>' +
        '</div>';
      estado.el = {
        pista: ctx.escenario.querySelector(".pista"),
        jugador: ctx.escenario.querySelector(".auto-jugador"),
        rival: ctx.escenario.querySelector(".auto-rival"),
        pregunta: ctx.escenario.querySelector(".pregunta"),
        opciones: ctx.escenario.querySelector(".opciones"),
        cuenta: ctx.escenario.querySelector(".cuenta"),
        turbo: ctx.escenario.querySelector(".estado-turbo")
      };
      marcador();
      colocar();
      cuentaRegresiva(3);
    }

    /** Mueve los autos según el progreso (0 = salida, 1 = meta). */
    function colocar() {
      var ancho = estado.el.pista.clientWidth - estado.el.jugador.offsetWidth - 56;
      estado.el.jugador.style.transform = "translateX(" + Math.min(1, estado.p) * ancho + "px)";
      estado.el.rival.style.transform = "translateX(" + Math.min(1, estado.r) * ancho + "px)";
    }

    function cuentaRegresiva(n) {
      var c = estado.el.cuenta;
      c.textContent = n > 0 ? n : "¡Ya!";
      c.classList.remove("pulso"); void c.offsetWidth; c.classList.add("pulso");
      K.sonido.tono(n > 0 ? 440 : 880, 0.15, "square", 0.06);
      if (n > 0) return despues(650, function () { cuentaRegresiva(n - 1); });
      despues(400, function () { c.textContent = ""; });
      estado.activa = true;
      nuevaPregunta();
      var anterior = performance.now();
      var loop = function (ahora) {
        if (!estado.activa) return;
        var dt = Math.min(0.1, (ahora - anterior) / 1000); anterior = ahora;
        estado.r += dt / L.segundosRival(estado.nivel);
        colocar();
        if (estado.r >= 1) return finCarrera(false);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    function nuevaPregunta() {
      var q = L.generarMultiplicacion(null, tablasElegidas);
      estado.q = q; estado.bloqueo = false;
      estado.el.pregunta.textContent = q.a + " × " + q.b;
      estado.el.pregunta.classList.remove("entra"); void estado.el.pregunta.offsetWidth; estado.el.pregunta.classList.add("entra");
      estado.el.opciones.innerHTML = q.opciones.map(function (v, i) {
        return '<button type="button" class="opcion" data-v="' + v + '"><small>' + (i + 1) + '</small>' + v + '</button>';
      }).join("");
    }

    function responder(boton) {
      if (!estado || !estado.activa || estado.bloqueo || !boton) return;
      estado.bloqueo = true;
      var ok = +boton.dataset.v === estado.q.correcta;
      var caja = ctx.escenario.querySelector(".carrera");
      var r = boton.getBoundingClientRect(), base = caja.getBoundingClientRect();
      if (ok) {
        estado.racha++; estado.aciertos++;
        var turbo = estado.racha >= 3;
        estado.p += L.avanceJugador(estado.racha);
        estado.puntos += turbo ? 15 : 10;
        boton.classList.add("bien");
        K.flotante(caja, turbo ? "+15 turbo" : "+10", r.left - base.left + r.width / 2, r.top - base.top, "bien");
        if (estado.racha === 3) { K.sonido.combo(); estado.el.turbo.textContent = "¡Turbo activado!"; } else K.sonido.acierto();
        estado.el.jugador.classList.toggle("con-turbo", turbo);
        colocar();
        marcador();
        if (estado.p >= 1) return finCarrera(true);
        despues(220, nuevaPregunta);
      } else {
        estado.racha = 0; estado.fallos++; estado.vidas--;
        estado.el.turbo.textContent = estado.q.a + " × " + estado.q.b + " = " + estado.q.correcta;
        estado.el.jugador.classList.remove("con-turbo");
        boton.classList.add("mal");
        estado.el.opciones.querySelectorAll(".opcion").forEach(function (o) { if (+o.dataset.v === estado.q.correcta) o.classList.add("bien"); });
        estado.el.jugador.classList.remove("derrape"); void estado.el.jugador.offsetWidth; estado.el.jugador.classList.add("derrape");
        K.sonido.error();
        marcador();
        if (estado.vidas <= 0) { estado.activa = false; return despues(900, function () { finPartida(); }); }
        despues(900, function () { estado.el.turbo.textContent = ""; nuevaPregunta(); });
      }
    }

    function finCarrera(gano) {
      estado.activa = false;
      cancelAnimationFrame(raf);
      var bono = gano ? Math.round((1 - Math.min(1, estado.r)) * 100) : 0;
      if (gano) { estado.ganadas++; estado.puntos += bono; K.sonido.nivel(); K.confeti(ctx.escenario); }
      else K.sonido.perder();
      marcador();
      var ultima = estado.nivel >= 3;
      var aviso = document.createElement("div");
      aviso.className = "aviso-nivel";
      aviso.innerHTML = gano
        ? "<h3>¡Ganaste la carrera " + estado.nivel + "!</h3><p>Ventaja sobre el rival: +" + bono + " puntos.</p>" +
          (ultima ? "" : "<p>La siguiente carrera el rival irá más rápido.</p>")
        : "<h3>El rival llegó primero</h3><p>Llevas " + estado.ganadas + " de 3 carreras ganadas.</p>";
      var b = document.createElement("button");
      b.type = "button"; b.className = "boton boton-principal";
      b.textContent = gano && !ultima ? "Siguiente carrera" : "Ver resultado";
      b.addEventListener("click", function () {
        if (gano && !ultima) { estado.nivel++; empezarCarrera(); } else finPartida();
      });
      aviso.appendChild(b);
      ctx.escenario.querySelector(".carrera").appendChild(aviso);
      b.focus();
    }

    function finPartida() {
      limpiar();
      var total = estado.aciertos + estado.fallos;
      ctx.terminar(estado.puntos,
        "Ganaste " + estado.ganadas + " de 3 carreras con " + estado.aciertos + " aciertos de " + total + " respuestas.",
        L.estrellas(estado.ganadas));
    }

    ctx.escenario.addEventListener("click", function (e) { responder(e.target.closest(".opcion")); });
    alTeclear = function (e) {
      if (!estado || !estado.activa) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) responder(estado.el.opciones.querySelectorAll(".opcion")[n - 1]);
    };
    document.addEventListener("keydown", alTeclear);

    pantallaInicio();
    return limpiar;
  };
})();
