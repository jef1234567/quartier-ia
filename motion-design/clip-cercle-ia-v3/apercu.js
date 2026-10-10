/* Aperçu sans installation : s'active seulement quand index.html est ouvert directement
   (double-clic, adresse en file:) ou avec ?apercu dans l'adresse. Inactif pendant un rendu. */
(function () {
  if (!(location.protocol === "file:" || /[?&]apercu\b/.test(location.search))) return;
  window.__clipQualite = "apercu";       // rendu allégé, pour tourner en temps réel
  window.addEventListener("load", function () {
    var racine = document.querySelector("[data-composition-id]");
    var tl = window.__timelines && window.__timelines[racine.getAttribute("data-composition-id")];
    if (!tl) return;
    var W = +racine.getAttribute("data-width"), H = +racine.getAttribute("data-height");
    var clips = racine.querySelectorAll("section[data-start]");
    var son = racine.querySelector("audio");

    document.documentElement.style.background = "#000";
    document.body.style.background = "#000";
    document.body.style.overflow = "hidden";
    racine.style.width = W + "px";
    racine.style.height = H + "px";
    racine.style.transformOrigin = "0 0";
    racine.style.cursor = "pointer";

    function ajuster() {
      var e = Math.min(innerWidth / W, innerHeight / H);
      racine.style.transform = "translate(" + (innerWidth - W * e) / 2 + "px," + (innerHeight - H * e) / 2 + "px) scale(" + e + ")";
    }
    function clipsA(t) {
      for (var i = 0; i < clips.length; i++) {
        var d = +clips[i].getAttribute("data-start"), n = +clips[i].getAttribute("data-duration");
        clips[i].style.visibility = t >= d && t <= d + n ? "visible" : "hidden";
      }
    }
    tl.eventCallback("onUpdate", function () { clipsA(tl.time()); });
    addEventListener("resize", ajuster);
    // Les navigateurs ne lancent le son qu'après un geste : le premier clic relance le clip avec la bande-son.
    addEventListener("click", function () { tl.restart(); if (son) { son.currentTime = 0; son.play().catch(function () {}); } });
    addEventListener("keydown", function (ev) {
      if (ev.key === " ") { ev.preventDefault(); tl.paused(!tl.paused()); if (son) { if (tl.paused()) son.pause(); else son.play().catch(function () {}); } }
    });
    ajuster();
    clipsA(0);
    tl.play(0);
  });
})();
