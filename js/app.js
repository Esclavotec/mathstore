/*
  app.js: la tienda.
  - Pinta el carrusel de destacados, los filtros y la rejilla de tarjetas.
  - Al hacer clic en una tarjeta abre el modal de detalle (también con #id en la URL).
  - El botón del detalle depende de recurso.tipo:
      "jugar"     → abre el juego integrado (window.MathJuegos[recurso.url]) en el modal
      "descargar" → enlace de descarga al archivo de recurso.url
      "web"       → enlace a recurso.url en una pestaña nueva
*/
(function () {
  "use strict";
  var L = window.MathLogica;
  var $ = function (s) { return document.querySelector(s); };

  var recursos = [];
  var filtros = { texto: "", tema: "", tipo: "", nivel: "" };
  var destacados = [], indiceDestacado = 0;
  var limpiarJuego = null;

  var TIPOS = {
    jugar: { nombre: "Jugar", insignia: "Juego" },
    descargar: { nombre: "Descargar", insignia: "Descargable" },
    web: { nombre: "Ir al sitio web", insignia: "Sitio web" }
  };
  var ICONOS = {
    jugar: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 4v16l13-8z" fill="currentColor"/></svg>',
    descargar: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 20h16" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    web: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /** Escapa texto para insertarlo en HTML (los datos pueden venir de Firestore). */
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function nivelBonito(n) { return n === "primaria" ? "Primaria" : n === "secundaria" ? "Secundaria" : esc(n); }

  /* ---------- Récords (solo en este navegador) ---------- */
  function leerRecord(id) { try { return +localStorage.getItem("mathstore-record-" + id) || 0; } catch (e) { return 0; } }
  function guardarRecord(id, p) { try { localStorage.setItem("mathstore-record-" + id, p); } catch (e) { /* sin almacenamiento */ } }

  /* ---------- Botón de acción según el tipo ---------- */
  function botonAccion(r, clase) {
    var t = TIPOS[r.tipo];
    var contenido = ICONOS[r.tipo] + "<span>" + t.nombre + "</span>";
    if (r.tipo === "jugar") {
      return '<button type="button" class="boton ' + clase + '" data-jugar="' + esc(r.id) + '">' + contenido + "</button>";
    }
    if (r.tipo === "descargar") {
      var archivo = String(r.url).split("/").pop();
      return '<a class="boton ' + clase + '" href="' + esc(r.url) + '" download="' + esc(archivo) + '">' + contenido + "</a>";
    }
    return '<a class="boton ' + clase + '" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + contenido + "</a>";
  }

  /* ---------- Carrusel ---------- */
  function pintarDestacado() {
    var caja = $("#destacado");
    if (!destacados.length) { caja.closest(".destacados").hidden = true; return; }
    var r = destacados[indiceDestacado];
    caja.innerHTML =
      '<button class="destacado-portada" type="button" data-abrir="' + esc(r.id) + '" aria-label="Ver ' + esc(r.titulo) + '">' +
        '<img src="' + esc(r.portada) + '" alt="">' +
      "</button>" +
      '<div class="destacado-info">' +
        '<span class="sobre">Destacado · ' + esc(r.tema) + "</span>" +
        "<h1>" + esc(r.titulo) + "</h1>" +
        "<p>" + esc(r.descripcion) + "</p>" +
        '<div class="acciones">' + botonAccion(r, "boton-principal") +
          '<button type="button" class="boton boton-secundario" data-abrir="' + esc(r.id) + '">Ver detalles</button>' +
        "</div>" +
      "</div>";
    $("#dest-puntos").innerHTML = destacados.map(function (d, i) {
      return '<button type="button" class="punto" data-punto="' + i + '" aria-label="Destacado ' + (i + 1) + '"' +
        (i === indiceDestacado ? ' aria-current="true"' : "") + "></button>";
    }).join("");
  }
  function moverDestacado(paso) {
    indiceDestacado = (indiceDestacado + paso + destacados.length) % destacados.length;
    pintarDestacado();
  }

  /* ---------- Filtros ---------- */
  function pintarChips(contenedor, clave, valores, etiqueta) {
    var html = '<button type="button" class="chip" data-clave="' + clave + '" data-valor="" aria-pressed="' + (!filtros[clave]) + '">Todos</button>';
    html += valores.map(function (v) {
      return '<button type="button" class="chip" data-clave="' + clave + '" data-valor="' + esc(v) + '" aria-pressed="' + (filtros[clave] === v) + '">' + esc(etiqueta(v)) + "</button>";
    }).join("");
    contenedor.innerHTML = html;
  }
  function pintarFiltros() {
    var temas = [];
    recursos.forEach(function (r) { if (temas.indexOf(r.tema) === -1) temas.push(r.tema); });
    pintarChips($("#filtro-tema"), "tema", temas.sort(), function (v) { return v; });
    // Solo se ofrecen los tipos que de verdad hay en el catálogo (p. ej. sin "Descargable" si no hay archivos)
    var tipos = Object.keys(TIPOS).filter(function (t) { return recursos.some(function (r) { return r.tipo === t; }); });
    pintarChips($("#filtro-tipo"), "tipo", tipos, function (v) { return TIPOS[v].insignia; });
  }

  /* ---------- Rejilla ---------- */
  function pintarRejilla() {
    var lista = L.filtrarCatalogo(recursos, filtros);
    $("#rejilla").innerHTML = lista.map(function (r) {
      return '<button type="button" class="tarjeta" data-abrir="' + esc(r.id) + '">' +
        '<img src="' + esc(r.portada) + '" alt="" loading="lazy">' +
        '<div class="tarjeta-info">' +
          "<h3>" + esc(r.titulo) + "</h3>" +
          '<div class="meta"><span>' + esc(r.tema) + " · " + nivelBonito(r.nivel) + "</span>" +
          '<span class="tipo tipo-' + esc(r.tipo) + '">' + TIPOS[r.tipo].insignia + "</span></div>" +
        "</div></button>";
    }).join("");
    $("#vacio").hidden = lista.length > 0;
    $("#contador").textContent = lista.length + " de " + recursos.length + " recursos";
  }

  /* ---------- Modal de detalle ---------- */
  var modal = $("#modal"), cuerpo = $("#modal-cuerpo");

  function buscar(id) { return recursos.filter(function (r) { return r.id === id; })[0]; }

  function abrirDetalle(id, sinHash) {
    var r = buscar(id);
    if (!r) return;
    pararJuego();
    modal.classList.remove("modal-juego", "modal-marco");
    var aviso = r.tipo === "web" ? "Se abre en una pestaña nueva: " + esc(String(r.url).replace(/^https?:\/\//, "").split("/")[0])
      : r.tipo === "descargar" ? "Archivo para descargar." : "Se juega aquí mismo, sin instalar nada.";
    if (r.autor) aviso += "<br>Créditos: " + esc(r.autor);
    var record = r.tipo === "jugar" && leerRecord(r.id) ? " · Tu récord: <b>" + leerRecord(r.id) + "</b> puntos" : "";
    cuerpo.innerHTML =
      '<img class="detalle-portada" src="' + esc(r.portada) + '" alt="Portada de ' + esc(r.titulo) + '">' +
      '<div class="detalle-info">' +
        '<div><span class="tipo tipo-' + esc(r.tipo) + '">' + TIPOS[r.tipo].insignia + "</span></div>" +
        '<h2 id="modal-titulo">' + esc(r.titulo) + "</h2>" +
        '<dl class="ficha">' +
          "<div><dt>Tema</dt><dd>" + esc(r.tema) + "</dd></div>" +
          "<div><dt>Nivel</dt><dd>" + nivelBonito(r.nivel) + "</dd></div>" +
          (r.edad ? "<div><dt>Edad</dt><dd>" + esc(r.edad) + "</dd></div>" : "") +
          (r.duracion ? "<div><dt>Duración</dt><dd>" + esc(r.duracion) + "</dd></div>" : "") +
        "</dl>" +
        "<p>" + esc(r.descripcion) + "</p>" +
        '<div class="etiquetas">' + (r.etiquetas || []).map(function (e) { return "<span>" + esc(e) + "</span>"; }).join("") + "</div>" +
        "<div>" + botonAccion(r, "boton-principal") + "</div>" +
        '<span class="aviso">' + aviso + record + "</span>" +
      "</div>";
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    if (!sinHash && location.hash !== "#" + r.id) history.replaceState(null, "", "#" + r.id);
  }

  function pararJuego() { if (limpiarJuego) { limpiarJuego(); limpiarJuego = null; } }

  /** ¿El recurso es un juego HTML completo (p. ej. games/tiendita-cuadrilateros/index.html)? */
  function esJuegoHTML(r) { return /\.html?$/i.test(String(r.url)); }

  function cabeceraVisor(r, conSonido) {
    var son = window.MathKit && window.MathKit.sonido.on;
    return '<div class="visor-cabecera">' +
      '<button type="button" class="boton boton-secundario" data-abrir="' + esc(r.id) + '">‹ Volver</button>' +
      '<h2 id="modal-titulo">' + esc(r.titulo) + "</h2>" +
      '<div class="marcador" id="marcador"></div>' +
      (conSonido ? '<button type="button" class="boton boton-secundario boton-sonido" id="boton-sonido" aria-pressed="' + son + '">Sonido: ' + (son ? "sí" : "no") + "</button>" : "") +
      "</div>";
  }

  /** Juegos HTML completos: se cargan en un marco que ocupa el visor. */
  function jugarHTML(r) {
    pararJuego();
    modal.classList.add("modal-juego", "modal-marco");
    cuerpo.innerHTML = '<div class="visor visor-marco">' + cabeceraVisor(r, false) +
      '<iframe class="marco-juego" src="' + esc(r.url) + '" title="' + esc(r.titulo) + '" allow="autoplay; fullscreen"></iframe>' +
      '<p class="aviso">¿No carga? <a href="' + esc(r.url) + '" target="_blank" rel="noopener">Abrir el juego en una pestaña nueva</a>.</p>' +
      "</div>";
    if (!modal.open) modal.showModal();
  }

  /** Abre el visor y monta el juego con el contrato descrito en js/juegos/carrera-tablas.js. */
  function jugar(id) {
    var r = buscar(id);
    if (r && esJuegoHTML(r)) return jugarHTML(r);
    var juego = r && window.MathJuegos && window.MathJuegos[r.url];
    if (!juego) { alertaEnModal("Este juego no está disponible."); return; }
    pararJuego();
    modal.classList.add("modal-juego");
    modal.classList.remove("modal-marco");
    cuerpo.innerHTML = '<div class="visor">' + cabeceraVisor(r, true) + '<div class="escenario" id="escenario"></div></div>';
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    var escenario = $("#escenario");
    limpiarJuego = juego({
      escenario: escenario,
      marcador: function (obj) {
        $("#marcador").innerHTML = Object.keys(obj).map(function (k) { return "<span>" + esc(k) + " <b>" + esc(obj[k]) + "</b></span>"; }).join("");
      },
      terminar: function (puntos, resumen, estrellas) {
        pararJuego();
        var anterior = leerRecord(r.id), nuevo = puntos > anterior;
        if (nuevo) guardarRecord(r.id, puntos);
        estrellas = Math.max(0, Math.min(3, estrellas || 0));
        $("#marcador").innerHTML = "";
        escenario.innerHTML =
          '<div class="resultado">' +
            '<p class="estrellas-fin" aria-label="' + estrellas + ' de 3 estrellas">' +
              [0, 1, 2].map(function (i) { return '<span class="' + (i < estrellas ? "llena" : "") + '" style="--i:' + i + '">★</span>'; }).join("") +
            "</p>" +
            "<h3>" + (nuevo ? "¡Nuevo récord!" : estrellas === 3 ? "¡Perfecto!" : "¡Buen intento!") + "</h3>" +
            '<p class="puntos-fin">' + puntos + " <span>puntos</span></p>" +
            "<p>" + esc(resumen) + (anterior && !nuevo ? " Tu récord es " + anterior + "." : "") + "</p>" +
            '<button type="button" class="boton boton-principal boton-grande" data-jugar="' + esc(r.id) + '">Jugar otra vez</button>' +
          "</div>";
        if (estrellas === 3 && window.MathKit) window.MathKit.confeti(escenario);
      }
    });
  }

  function alertaEnModal(texto) { cuerpo.innerHTML = '<div class="detalle-info"><p>' + esc(texto) + "</p></div>"; if (!modal.open) modal.showModal(); }

  function cerrarModal() { modal.close(); }
  modal.addEventListener("close", function () {
    // El evento "close" llega con retraso: si el modal ya se volvió a abrir, no borrar nada.
    if (modal.open) return;
    pararJuego();
    cuerpo.innerHTML = "";
    modal.classList.remove("modal-juego", "modal-marco");
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  });
  // clic fuera del contenido (en el fondo) cierra
  modal.addEventListener("click", function (e) { if (e.target === modal) cerrarModal(); });
  $("#modal-cerrar").addEventListener("click", cerrarModal);

  /* ---------- Eventos (delegados) ---------- */
  document.addEventListener("click", function (e) {
    var el;
    if ((el = e.target.closest("[data-jugar]"))) { jugar(el.dataset.jugar); return; }
    if ((el = e.target.closest("#boton-sonido"))) {
      var on = window.MathKit.sonido.alternar();
      el.setAttribute("aria-pressed", on); el.textContent = "Sonido: " + (on ? "sí" : "no");
      return;
    }
    if ((el = e.target.closest("[data-abrir]"))) { abrirDetalle(el.dataset.abrir); return; }
    if ((el = e.target.closest("[data-punto]"))) { indiceDestacado = +el.dataset.punto; pintarDestacado(); return; }
    if ((el = e.target.closest(".chip"))) {
      filtros[el.dataset.clave] = el.dataset.valor;
      pintarFiltros(); pintarRejilla();
    }
  });
  $("#dest-prev").addEventListener("click", function () { moverDestacado(-1); });
  $("#dest-next").addEventListener("click", function () { moverDestacado(1); });
  $("#buscador").addEventListener("input", function (e) { filtros.texto = e.target.value; pintarRejilla(); });
  $("#filtro-nivel").addEventListener("change", function (e) { filtros.nivel = e.target.value; pintarRejilla(); });

  function desdeHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (id && buscar(id)) abrirDetalle(id, true);
  }
  window.addEventListener("hashchange", desdeHash);

  /* ---------- Arranque ---------- */
  window.cargarCatalogo().then(function (res) {
    recursos = res.recursos.filter(function (r) { return TIPOS[r.tipo]; });
    destacados = recursos.filter(function (r) { return r.destacado; });
    $("#fuente-datos").textContent = res.fuente === "firebase" ? "catálogo en Firebase" : "catálogo local";
    pintarDestacado(); pintarFiltros(); pintarRejilla();
    desdeHash();
  }).catch(function (e) {
    $("#rejilla").innerHTML = "";
    $("#vacio").hidden = false;
    $("#vacio").textContent = "No se pudo cargar el catálogo: " + e.message + ". Si abriste index.html con doble clic, usa un servidor local (ver README).";
  });
})();
