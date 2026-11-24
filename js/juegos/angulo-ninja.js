/*
  Ángulo Ninja (v2)
  El ninja está en el vértice; el suelo hacia la derecha marca 0°. Apunta moviendo el dedo o el ratón
  y toca para lanzar la estrella. No hay transportador: hay que estimar los grados.
  - Nivel 1: 3 linternas muy separadas. Corta la que está al ángulo pedido.
  - Nivel 2: 4 linternas más juntas.
  - Nivel 3: sin linternas. "Lanza a 135°": aciertas si te desvías 10° o menos.
  - 5 lanzamientos por nivel y 3 vidas para toda la partida.
  - Después de cada lanzamiento se dibuja el ángulo real con su medida.
  - Teclado: flechas para apuntar (de 5° en 5°) y Enter o Espacio para lanzar.
  Mismo contrato que el resto de juegos (ver carrera-tablas.js).
*/
(function () {
  "use strict";
  var L = window.MathLogica, K = window.MathKit;
  window.MathJuegos = window.MathJuegos || {};

  var LANZAMIENTOS = 5;
  var NIVELES = [null,
    { linternas: 3, separacion: 40, texto: "Corta la linterna que está a" },
    { linternas: 4, separacion: 22, texto: "Corta la linterna que está a" },
    { linternas: 0, tolerancia: 10, texto: "Lanza la estrella a" }];
  var MARGEN_GOLPE = 9; // grados alrededor de una linterna que cuentan como impacto

  window.MathJuegos["angulo-ninja"] = function (ctx) {
    var raf = 0, timeouts = [], obs = null;
    var est = null, lienzo, g, W = 0, H = 0, V = { x: 0, y: 0 }, R = 0;
    var particulas = [];

    function despues(ms, fn) { timeouts.push(setTimeout(fn, ms)); }
    function limpiar() { cancelAnimationFrame(raf); timeouts.forEach(clearTimeout); timeouts = []; if (obs) obs.disconnect(); }

    function marcador() {
      ctx.marcador({ Nivel: est.nivel + "/3", Lanzamiento: Math.min(est.ronda + 1, LANZAMIENTOS) + "/" + LANZAMIENTOS, Puntos: est.puntos, Vidas: K.corazones(est.vidas, 3) });
    }

    function inicio() {
      K.intro(ctx.escenario, {
        titulo: "Ángulo Ninja",
        subtitulo: "Estima ángulos sin transportador.",
        pasos: [
          "El ninja está en el vértice. El suelo hacia la derecha marca <b>0°</b> y hacia la izquierda, <b>180°</b>.",
          "Mueve el dedo o el ratón para apuntar y toca para lanzar.",
          "Niveles 1 y 2: corta la linterna que está al ángulo pedido.",
          "Nivel 3: no hay linternas. Lanza a la medida exacta, con un margen de 10°."
        ],
        boton: "¡A entrenar!",
        alEmpezar: function () { est = { nivel: 1, ronda: 0, puntos: 0, vidas: 3, aciertos: 0, total: 0, niveles: 0 }; montar(); nuevaRonda(); }
      });
      ctx.marcador({});
    }

    /* ---------- Montaje del lienzo ---------- */
    function montar() {
      ctx.escenario.innerHTML =
        '<div class="ninja">' +
          '<p class="orden" aria-live="polite"></p>' +
          '<div class="lienzo-caja"><canvas tabindex="0" aria-label="Zona de lanzamiento. Flechas para apuntar, Enter para lanzar."></canvas></div>' +
          '<p class="explicacion" aria-live="polite"></p>' +
        '</div>';
      lienzo = ctx.escenario.querySelector("canvas");
      g = lienzo.getContext("2d");
      var caja = ctx.escenario.querySelector(".lienzo-caja");
      var medir = function () {
        var dpr = window.devicePixelRatio || 1;
        W = caja.clientWidth; H = Math.round(Math.min(440, Math.max(260, W * 0.58)));
        lienzo.width = W * dpr; lienzo.height = H * dpr;
        lienzo.style.height = H + "px";
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        V = { x: W / 2, y: H - 34 };
        R = Math.min(W / 2 - 36, H - 70);
      };
      medir();
      if (window.ResizeObserver) { obs = new ResizeObserver(medir); obs.observe(caja); }

      var apuntar = function (e) {
        if (!est || est.fase !== "apuntando") return;
        var r = lienzo.getBoundingClientRect();
        est.mira = Math.round(L.anguloDesde(e.clientX - r.left - V.x, V.y - (e.clientY - r.top)));
      };
      lienzo.addEventListener("pointermove", apuntar);
      lienzo.addEventListener("pointerdown", apuntar);
      lienzo.addEventListener("pointerup", function (e) { apuntar(e); lanzar(); });
      lienzo.addEventListener("keydown", function (e) {
        if (!est || est.fase !== "apuntando") return;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") { est.mira = Math.min(180, est.mira + 5); e.preventDefault(); }
        else if (e.key === "ArrowRight" || e.key === "ArrowDown") { est.mira = Math.max(0, est.mira - 5); e.preventDefault(); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); lanzar(); }
      });
      var anterior = performance.now();
      var bucle = function (t) { var dt = Math.min(0.05, (t - anterior) / 1000); anterior = t; actualizar(dt); dibujar(t); raf = requestAnimationFrame(bucle); };
      raf = requestAnimationFrame(bucle);
    }

    function q(s) { return ctx.escenario.querySelector(s); }

    /* ---------- Rondas ---------- */
    function nuevaRonda() {
      var n = NIVELES[est.nivel];
      est.fase = "apuntando"; est.mira = 90; est.estrella = null; est.revelar = null;
      if (n.linternas) {
        var gen = L.generarLinternas(n.linternas, n.separacion);
        est.linternas = gen.angulos.map(function (a) { return { a: a, viva: true, fase: Math.random() * 6 }; });
        est.objetivo = gen.angulos[gen.objetivo];
        est.idxObjetivo = gen.objetivo;
      } else {
        est.linternas = []; est.idxObjetivo = -1;
        est.objetivo = L.entero(3, 35) * 5; // 15°–175°
      }
      q(".orden").innerHTML = n.texto + ' <b class="grados">' + est.objetivo + '°</b>';
      q(".explicacion").textContent = ""; q(".explicacion").className = "explicacion";
      marcador();
    }

    function lanzar() {
      if (!est || est.fase !== "apuntando") return;
      est.fase = "volando";
      est.estrella = { t: 0, a: est.mira };
      K.sonido.tono(900, 0.12, "sawtooth", 0.03);
    }

    function impacto() {
      var n = NIVELES[est.nivel], lanzado = est.estrella.a, exp = q(".explicacion");
      var ok, puntos = 0, texto;
      est.total++;
      if (n.linternas) {
        var idx = L.linternaAlcanzada(est.linternas.map(function (l) { return l.a; }), lanzado, MARGEN_GOLPE);
        if (idx !== -1) romper(est.linternas[idx]);
        ok = idx === est.idxObjetivo;
        if (ok) { puntos = 100; texto = "¡Corte limpio! Esa linterna estaba a " + est.objetivo + "° (ángulo " + L.tipoAngulo(est.objetivo) + ")."; }
        else if (idx !== -1) texto = "Esa linterna estaba a " + est.linternas[idx].a + "°. La de " + est.objetivo + "° es la verde.";
        else texto = "No tocaste ninguna linterna: lanzaste a " + lanzado + "°. La de " + est.objetivo + "° es la verde.";
      } else {
        var err = Math.abs(lanzado - est.objetivo);
        ok = err <= n.tolerancia;
        puntos = ok ? L.puntajeAngulo(est.objetivo, lanzado) : 0;
        texto = (ok ? "¡Muy bien! " : "Casi. ") + "Lanzaste a " + lanzado + "° y el objetivo era " + est.objetivo + "°: te desviaste " + err + "°.";
        if (ok) chispas(puntoEn(est.objetivo, R * 0.9), "#8fdc9e");
      }
      est.revelar = { objetivo: est.objetivo, lanzado: lanzado, ok: ok };
      exp.textContent = texto; exp.classList.add(ok ? "bien" : "mal");
      if (ok) { est.aciertos++; est.puntos += puntos; K.sonido.acierto(); var p = puntoEn(lanzado, R * 0.9); K.flotante(q(".lienzo-caja"), "+" + puntos, p.x, p.y - 20, "bien"); }
      else { est.vidas--; K.sonido.error(); }
      est.fase = "revelando";
      marcador();
      despues(ok ? 1500 : 2600, siguiente);
    }

    function siguiente() {
      if (est.vidas <= 0) return fin();
      est.ronda++;
      if (est.ronda < LANZAMIENTOS) return nuevaRonda();
      est.niveles++;
      if (est.nivel >= 3) return fin();
      est.fase = "pausa";
      K.sonido.nivel(); K.confeti(ctx.escenario);
      var aviso = document.createElement("div");
      aviso.className = "aviso-nivel";
      aviso.innerHTML = "<h3>¡Nivel " + est.nivel + " superado!</h3><p>" +
        (est.nivel === 1 ? "Ahora hay 4 linternas y están más juntas." : "Último nivel: sin linternas. Lanza a la medida exacta.") + "</p>";
      var b = document.createElement("button");
      b.type = "button"; b.className = "boton boton-principal"; b.textContent = "Siguiente nivel";
      b.addEventListener("click", function () { aviso.remove(); est.nivel++; est.ronda = 0; nuevaRonda(); lienzo.focus(); });
      aviso.appendChild(b);
      q(".ninja").appendChild(aviso);
      b.focus();
    }

    function fin() {
      limpiar();
      ctx.terminar(est.puntos, "Acertaste " + est.aciertos + " de " + est.total + " lanzamientos y superaste " + est.niveles + " de 3 niveles.", L.estrellas(est.niveles));
    }

    /* ---------- Física y partículas ---------- */
    function puntoEn(grados, r) { var a = grados * Math.PI / 180; return { x: V.x + Math.cos(a) * r, y: V.y - Math.sin(a) * r }; }

    function romper(l) { l.viva = false; chispas(puntoEn(l.a, R * 0.9), "#e5484d"); }
    function chispas(p, color) {
      if (K.reducido) return;
      for (var i = 0; i < 18; i++) {
        var ang = Math.random() * Math.PI * 2, v = 60 + Math.random() * 140;
        particulas.push({ x: p.x, y: p.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 60, vida: 0.8, color: i % 3 ? color : "#f2cf5b" });
      }
    }

    function actualizar(dt) {
      if (est && est.fase === "volando") {
        est.estrella.t += dt / 0.38;
        if (est.estrella.t >= 1) { est.estrella.t = 1; impacto(); }
      }
      particulas = particulas.filter(function (p) {
        p.vida -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 320 * dt; return p.vida > 0;
      });
    }

    /* ---------- Dibujo ---------- */
    function dibujar(t) {
      if (!g || !W) return;
      var cielo = g.createLinearGradient(0, 0, 0, H);
      cielo.addColorStop(0, "#0f1a2e"); cielo.addColorStop(1, "#1b2c27");
      g.fillStyle = cielo; g.fillRect(0, 0, W, H);
      g.fillStyle = "#f4f1e6"; g.globalAlpha = 0.9; g.beginPath(); g.arc(W * 0.1, H * 0.18, 16, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
      g.fillStyle = "#14211d";
      g.beginPath(); g.moveTo(0, H); g.lineTo(0, H - 60); g.quadraticCurveTo(W * 0.25, H - 120, W * 0.5, H - 70); g.quadraticCurveTo(W * 0.75, H - 130, W, H - 60); g.lineTo(W, H); g.fill();
      // guía tenue del semicírculo (sin marcas: hay que estimar)
      g.strokeStyle = "rgba(233,239,233,0.12)"; g.lineWidth = 2; g.setLineDash([4, 10]);
      g.beginPath(); g.arc(V.x, V.y, R * 0.9, Math.PI, 0); g.stroke(); g.setLineDash([]);
      // suelo: rayo de 0° y prolongación a 180°
      g.strokeStyle = "#e9efe9"; g.lineWidth = 4; g.lineCap = "round";
      g.beginPath(); g.moveTo(V.x, V.y); g.lineTo(V.x + R, V.y); g.stroke();
      g.strokeStyle = "rgba(233,239,233,0.35)";
      g.beginPath(); g.moveTo(V.x, V.y); g.lineTo(V.x - R, V.y); g.stroke();
      g.fillStyle = "#a3b5ab"; g.font = "600 13px Inter, system-ui, sans-serif"; g.textAlign = "center";
      g.fillText("0°", V.x + R + 2, V.y + 22); g.fillText("180°", V.x - R, V.y + 22);

      if (!est) return;
      est.linternas.forEach(function (l, i) {
        if (!l.viva) return;
        var p = puntoEn(l.a, R * 0.9), flota = K.reducido ? 0 : Math.sin(t / 500 + l.fase) * 3;
        linterna(p.x, p.y + flota, est.revelar && i === est.idxObjetivo ? "#3f9d5a" : "#e5484d");
      });
      if (est.revelar) {
        arcoMedida(est.revelar.objetivo, R * 0.32, "#8fdc9e", est.revelar.objetivo + "°");
        if (!est.revelar.ok || !NIVELES[est.nivel].linternas) arcoMedida(est.revelar.lanzado, R * 0.55, "#f2cf5b", est.revelar.lanzado + "°", true);
      }
      if (est.fase === "apuntando") {
        var m = puntoEn(est.mira, R * 0.95);
        g.strokeStyle = "#f2cf5b"; g.lineWidth = 3; g.setLineDash([2, 9]);
        g.beginPath(); g.moveTo(V.x, V.y); g.lineTo(m.x, m.y); g.stroke(); g.setLineDash([]);
        g.fillStyle = "#f2cf5b"; g.beginPath(); g.arc(m.x, m.y, 5, 0, Math.PI * 2); g.fill();
      }
      if (est.estrella && est.fase === "volando") {
        var k = 1 - Math.pow(1 - est.estrella.t, 3), s = puntoEn(est.estrella.a, R * 0.9 * k);
        shuriken(s.x, s.y, t / 40);
      }
      ninja(est.fase === "apuntando" ? est.mira : (est.estrella ? est.estrella.a : 90));
      particulas.forEach(function (p) { g.globalAlpha = Math.max(0, p.vida / 0.8); g.fillStyle = p.color; g.fillRect(p.x - 3, p.y - 3, 6, 6); });
      g.globalAlpha = 1;
    }

    function linterna(x, y, color) {
      g.save(); g.translate(x, y);
      g.fillStyle = color === "#e5484d" ? "rgba(242,207,91,0.18)" : "rgba(143,220,158,0.3)";
      g.beginPath(); g.arc(0, 0, 30, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#a3b5ab"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -26); g.lineTo(0, -18); g.stroke();
      g.fillStyle = "#2b1d14"; g.fillRect(-9, -20, 18, 5); g.fillRect(-9, 15, 18, 5);
      g.fillStyle = color; g.beginPath(); g.ellipse(0, 0, 15, 17, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(0, 0, 6, 17, 0, 0, Math.PI * 2); g.stroke();
      g.restore();
    }

    function shuriken(x, y, giro) {
      g.save(); g.translate(x, y); g.rotate(giro);
      g.fillStyle = "#cfd8dc";
      for (var i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -4); g.lineTo(14, 0); g.lineTo(0, 4); g.fill(); }
      g.fillStyle = "#14211d"; g.beginPath(); g.arc(0, 0, 3, 0, Math.PI * 2); g.fill();
      g.restore();
    }

    function ninja(mira) {
      g.save(); g.translate(V.x, V.y);
      var a = -mira * Math.PI / 180;
      g.strokeStyle = "#1a1a1a"; g.lineWidth = 7; g.lineCap = "round";
      g.beginPath(); g.moveTo(0, -14); g.lineTo(Math.cos(a) * 26, -14 + Math.sin(a) * 26); g.stroke();
      g.fillStyle = "#1a1a1a"; g.beginPath(); g.ellipse(0, -8, 15, 12, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(0, -30, 13, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#e5484d"; g.fillRect(-13, -36, 26, 5);
      g.beginPath(); g.moveTo(-12, -34); g.lineTo(-24, -40); g.lineTo(-22, -30); g.fill();
      g.fillStyle = "#f1c7a5"; g.fillRect(-9, -31, 18, 6);
      g.fillStyle = "#1a1a1a"; g.fillRect(-6, -30, 4, 3); g.fillRect(2, -30, 4, 3);
      g.restore();
    }

    /** Arco desde 0° hasta `grados`, con rayo y etiqueta de la medida. */
    function arcoMedida(grados, r, color, etiqueta, punteado) {
      var p = puntoEn(grados, R * 0.9);
      g.strokeStyle = color; g.lineWidth = 3; if (punteado) g.setLineDash([6, 6]);
      g.beginPath(); g.moveTo(V.x, V.y); g.lineTo(p.x, p.y); g.stroke();
      g.beginPath(); g.arc(V.x, V.y, r, 0, -grados * Math.PI / 180, true); g.stroke(); g.setLineDash([]);
      var e = puntoEn(grados / 2, r + 18);
      g.font = "700 15px 'JetBrains Mono', ui-monospace, monospace"; g.textAlign = "center";
      g.fillStyle = "#14211d"; var w = g.measureText(etiqueta).width + 10; g.fillRect(e.x - w / 2, e.y - 13, w, 19);
      g.fillStyle = color; g.fillText(etiqueta, e.x, e.y + 1);
    }

    inicio();
    return limpiar;
  };
})();
