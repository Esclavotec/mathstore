/*
  catalogo.js: obtiene la lista de recursos.
  1. Si window.FIREBASE_CONFIG tiene datos, carga el SDK de Firebase y lee la
     colección "recursos" de Firestore.
  2. Si no hay configuración, o Firestore falla o está vacío, usa data/catalogo.json.
  Devuelve { recursos, fuente } con fuente = "firebase" | "local".
*/
(function () {
  "use strict";
  var VERSION_FIREBASE = "10.12.2";

  function cargarScript(src) {
    return new Promise(function (ok, error) {
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = function () { error(new Error("No se pudo cargar " + src)); };
      document.head.appendChild(s);
    });
  }

  function desdeFirebase(config) {
    var base = "https://cdn.jsdelivr.net/npm/firebase@" + VERSION_FIREBASE + "/";
    return cargarScript(base + "firebase-app-compat.js")
      .then(function () { return cargarScript(base + "firebase-firestore-compat.js"); })
      .then(function () {
        var app = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(config);
        return app.firestore().collection("recursos").get();
      })
      .then(function (snap) {
        var lista = snap.docs.map(function (d) { var r = d.data(); r.id = r.id || d.id; return r; });
        if (!lista.length) throw new Error("La colección 'recursos' está vacía");
        // orden opcional con el campo numérico "orden"
        lista.sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); });
        return lista;
      });
  }

  function desdeLocal() {
    return fetch("data/catalogo.json").then(function (r) {
      if (!r.ok) throw new Error("No se pudo leer data/catalogo.json (" + r.status + ")");
      return r.json();
    });
  }

  window.cargarCatalogo = function () {
    var config = window.FIREBASE_CONFIG;
    if (!config) return desdeLocal().then(function (r) { return { recursos: r, fuente: "local" }; });
    return desdeFirebase(config)
      .then(function (r) { return { recursos: r, fuente: "firebase" }; })
      .catch(function (e) {
        console.warn("Firebase no disponible, se usa el catálogo local:", e.message);
        return desdeLocal().then(function (r) { return { recursos: r, fuente: "local" }; });
      });
  };
})();
