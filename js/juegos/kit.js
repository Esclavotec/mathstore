/*
  kit.js: piezas compartidas por los juegos de MathStore.
  - MathKit.sonido: efectos generados en el navegador (sin archivos de audio).
  - MathKit.intro(): pantalla de inicio con instrucciones y botón "Empezar".
  - MathKit.flotante(): texto que sube y se desvanece ("+10", "¡Combo!").
  - MathKit.confeti(): lluvia breve de papelitos al ganar.
  - MathKit.corazones(n, max): vidas como texto (♥♥♡).
*/
(function () {
  "use strict";
  var reducido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sonido ---------- */
  var ac = null;
  function leerPref() { try { return localStorage.getItem("mathstore-sonido") !== "no"; } catch (e) { return true; } }
  var sonido = {
    on: leerPref(),
    alternar: function () {
      sonido.on = !sonido.on;
      try { localStorage.setItem("mathstore-sonido", sonido.on ? "si" : "no"); } catch (e) { /* sin almacenamiento */ }
      return sonido.on;
    },
    /** Un tono simple: frecuencia (Hz), duración (s), forma de onda, volumen y retraso (s). */
    tono: function (f, d, tipo, vol, delay) {
      if (!sonido.on) return;
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        if (ac.state === "suspended") ac.resume();
        var t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
        o.type = tipo || "sine"; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.05);
      } catch (e) { /* audio no disponible */ }
    },
    acierto: function () { sonido.tono(660, 0.12, "triangle"); sonido.tono(990, 0.16, "triangle", 0.1, 0.07); },
    error: function () { sonido.tono(180, 0.28, "sawtooth", 0.06); },
    toque: function () { sonido.tono(520, 0.05, "square", 0.04); },
    combo: function () { [660, 880, 1100].forEach(function (f, i) { sonido.tono(f, 0.1, "square", 0.05, i * 0.05); }); },
    nivel: function () { [523, 659, 784, 1046].forEach(function (f, i) { sonido.tono(f, 0.18, "triangle", 0.1, i * 0.1); }); },
    perder: function () { [392, 330, 262].forEach(function (f, i) { sonido.tono(f, 0.25, "triangle", 0.09, i * 0.16); }); }
  };

  /* ---------- Pantalla de inicio ---------- */
  /**
   * opciones: { titulo, subtitulo, pasos: [texto], extra: html opcional (p. ej. selector de tablas),
   *             boton: "Empezar", alEmpezar: function(raiz) }
   */
  function intro(contenedor, o) {
    contenedor.innerHTML =
      '<div class="juego-intro">' +
        '<h3>' + o.titulo + '</h3>' +
        (o.subtitulo ? '<p class="juego-intro-sub">' + o.subtitulo + '</p>' : '') +
        '<ol class="juego-pasos">' + o.pasos.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ol>' +
        (o.extra || '') +
        '<button type="button" class="boton boton-principal boton-grande" data-empezar>' + (o.boton || 'Empezar') + '</button>' +
      '</div>';
    contenedor.querySelector('[data-empezar]').addEventListener('click', function () { o.alEmpezar(contenedor); });
  }

  /* ---------- Texto flotante ---------- */
  function flotante(contenedor, texto, x, y, clase) {
    var s = document.createElement('span');
    s.className = 'flotante ' + (clase || '');
    s.textContent = texto;
    s.style.left = x + 'px'; s.style.top = y + 'px';
    contenedor.appendChild(s);
    setTimeout(function () { s.remove(); }, 900);
  }

  /* ---------- Confeti ---------- */
  var COLORES = ['#f2cf5b', '#8fdc9e', '#7cc4e8', '#ef8f9c', '#e9efe9'];
  function confeti(contenedor) {
    if (reducido) return;
    for (var i = 0; i < 36; i++) {
      var p = document.createElement('i');
      p.className = 'confeti';
      p.style.left = (Math.random() * 100) + '%';
      p.style.background = COLORES[i % COLORES.length];
      p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      p.style.setProperty('--giro', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDelay = (Math.random() * 0.25) + 's';
      contenedor.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 1600); })(p);
    }
  }

  function corazones(n, max) { var s = ''; for (var i = 0; i < max; i++) s += i < n ? '♥' : '♡'; return s; }

  window.MathKit = { sonido: sonido, intro: intro, flotante: flotante, confeti: confeti, corazones: corazones, reducido: reducido };
})();
