// Pantalla de carga: un empaque de masa madre llena el bowl según lo que de verdad
// se ha descargado (video, imágenes, tipografías y datos). Se coloca como primer
// elemento del <body>. Si este archivo falla, la página funciona igual, sin pantalla.
//   data-images="a.webp,b.webp"  imágenes de fondo que el navegador no puede detectar
//   ShellsLoader.wait(promesa)   espera además algo propio, como los datos de Firebase
(function () {
    var MAX_WAIT_MS = 8000; // con conexión muy lenta se muestra la página de todos modos

    var script = document.currentScript;
    var style = document.createElement("style");
    style.textContent = [
        "#shells-loader{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;background:#1C1510;color:#F4EBDD;font-family:Arial,sans-serif;transition:opacity .3s ease}",
        "#shells-loader.is-done{opacity:0;pointer-events:none}",
        "#shells-loader svg{width:min(62vw,240px);height:auto;display:block}",
        "#shells-loader .sl-dough{transition:transform .35s ease-out}",
        "#shells-loader .sl-text{font-size:15px;letter-spacing:.5px}",
        "#shells-loader .sl-bar{width:min(62vw,240px);height:6px;border-radius:6px;background:rgba(244,235,221,.18);overflow:hidden}",
        "#shells-loader .sl-bar i{display:block;height:100%;width:100%;border-radius:6px;background:#DBA23C;transform:scaleX(0);transform-origin:left;transition:transform .35s ease-out}",
        "#shells-loader .sl-flour{animation:sl-fall .9s linear infinite}",
        "#shells-loader .sl-flour:nth-child(2){animation-delay:.22s}",
        "#shells-loader .sl-flour:nth-child(3){animation-delay:.45s}",
        "#shells-loader .sl-flour:nth-child(4){animation-delay:.67s}",
        "#shells-loader .sl-pack{transform-box:fill-box;transform-origin:center;animation:sl-shake 1.1s ease-in-out infinite}",
        "#shells-loader.is-full .sl-stream{opacity:0}",
        "#shells-loader.is-full .sl-pack{animation:none}",
        "@keyframes sl-fall{0%{transform:translateY(0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateY(62px);opacity:0}}",
        "@keyframes sl-shake{0%,100%{transform:rotate(0)}50%{transform:rotate(-3deg)}}",
        "@media (prefers-reduced-motion:reduce){#shells-loader .sl-flour,#shells-loader .sl-pack{animation:none}}"
    ].join("");
    document.head.appendChild(style);

    var DOUGH_HEIGHT = 82;
    var overlay = document.createElement("div");
    overlay.id = "shells-loader";
    overlay.setAttribute("role", "progressbar");
    overlay.setAttribute("aria-label", "Cargando la página");
    overlay.setAttribute("aria-valuemin", "0");
    overlay.setAttribute("aria-valuemax", "100");
    overlay.innerHTML =
        '<svg viewBox="0 0 240 212" aria-hidden="true">' +
            '<defs><clipPath id="sl-bowl"><path d="M38 116H202C202 170 166 198 120 198C74 198 38 170 38 116Z"/></clipPath></defs>' +
            // Empaque de masa madre, inclinado sobre el bowl
            '<g transform="rotate(38 96 42)"><g class="sl-pack">' +
                '<path d="M66 10H126L132 74H60Z" fill="#C9A26B"/>' +
                '<path d="M66 10H126L128 26H64Z" fill="#A9834F"/>' +
                '<path d="M60 74H132L126 84H66Z" fill="#8C6A3C"/>' +
                '<g fill="#3A2E24" transform="translate(84 31) scale(1)">' +
                    '<path d="M12 37V11" stroke="#3A2E24" stroke-width="2.2" stroke-linecap="round" fill="none"/>' +
                    '<ellipse cx="12" cy="6" rx="2.8" ry="5"/>' +
                    '<ellipse cx="6.6" cy="14" rx="2.6" ry="4.8" transform="rotate(-38 6.6 14)"/>' +
                    '<ellipse cx="17.4" cy="14" rx="2.6" ry="4.8" transform="rotate(38 17.4 14)"/>' +
                    '<ellipse cx="6.6" cy="22" rx="2.6" ry="4.8" transform="rotate(-38 6.6 22)"/>' +
                    '<ellipse cx="17.4" cy="22" rx="2.6" ry="4.8" transform="rotate(38 17.4 22)"/>' +
                '</g>' +
            '</g></g>' +
            // Masa que cae del empaque
            '<g class="sl-stream" fill="#F4EBDD" style="transition:opacity .3s">' +
                '<circle class="sl-flour" cx="118" cy="62" r="4.5"/>' +
                '<circle class="sl-flour" cx="125" cy="60" r="3.5"/>' +
                '<circle class="sl-flour" cx="112" cy="58" r="3"/>' +
                '<circle class="sl-flour" cx="121" cy="64" r="4"/>' +
            '</g>' +
            // Bowl con la masa subiendo
            '<path d="M38 116H202C202 170 166 198 120 198C74 198 38 170 38 116Z" fill="#2A211A"/>' +
            '<g clip-path="url(#sl-bowl)"><g class="sl-dough" style="transform:translateY(' + DOUGH_HEIGHT + 'px)">' +
                '<ellipse cx="120" cy="116" rx="86" ry="11" fill="#FFF8EC"/>' +
                '<rect x="30" y="116" width="180" height="90" fill="#F4EBDD"/>' +
            '</g></g>' +
            '<path d="M38 116H202C202 170 166 198 120 198C74 198 38 170 38 116Z" fill="none" stroke="#DBA23C" stroke-width="5" stroke-linejoin="round"/>' +
            '<path d="M30 116H210" stroke="#DBA23C" stroke-width="7" stroke-linecap="round"/>' +
        '</svg>' +
        '<div class="sl-text">Preparando la masa… <span class="sl-num">0</span>%</div>' +
        '<div class="sl-bar"><i></i></div>';
    (script.parentNode || document.body).insertBefore(overlay, script);

    var dough = overlay.querySelector(".sl-dough");
    var bar = overlay.querySelector(".sl-bar i");
    var num = overlay.querySelector(".sl-num");

    // ---------- Progreso real ----------
    var tasks = [];
    var shown = 0;
    var finished = false;
    var scanned = false;

    function addTask(weight) {
        var task = { weight: weight, done: 0 };
        tasks.push(task);
        return function (fraction) {
            task.done = Math.max(task.done, Math.min(1, fraction));
            refresh();
        };
    }

    function refresh() {
        // Hasta revisar toda la página no se sabe cuánto falta.
        if (finished || !scanned) return;
        var total = 0;
        var done = 0;
        tasks.forEach(function (t) { total += t.weight; done += t.weight * t.done; });
        var fraction = total ? done / total : 0;
        draw(fraction);
        if (fraction >= 1) finish();
    }

    function draw(fraction) {
        if (fraction < shown) return; // la masa nunca baja
        shown = fraction;
        dough.style.transform = "translateY(" + (DOUGH_HEIGHT * (1 - fraction)) + "px)";
        bar.style.transform = "scaleX(" + fraction + ")";
        var percent = Math.round(fraction * 100);
        num.textContent = percent;
        overlay.setAttribute("aria-valuenow", percent);
    }

    function finish() {
        if (finished) return;
        draw(1);
        finished = true;
        overlay.classList.add("is-full");
        setTimeout(function () {
            overlay.classList.add("is-done");
            setTimeout(function () { overlay.remove(); style.remove(); }, 350);
        }, 180);
    }

    function trackImage(img) {
        var set = addTask(1);
        if (img.complete) return set(1);
        var done = function () { set(1); };
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
    }

    function trackVideo(video) {
        var set = addTask(4);
        var ready = function () { set(1); };
        var update = function () {
            if (video.duration && video.buffered.length) {
                set(video.buffered.end(video.buffered.length - 1) / video.duration);
            }
        };
        video.addEventListener("progress", update);
        // Ya puede reproducirse: no hace falta esperar el video completo.
        video.addEventListener("canplaythrough", ready);
        video.addEventListener("playing", ready);
        // El celular dejó de descargar (ahorro de batería o de datos): se ve la imagen fija.
        video.addEventListener("suspend", ready);
        video.addEventListener("error", ready, true);
        if (video.readyState >= 3 || video.error) ready();
        else update();
    }

    function scanPage() {
        Array.prototype.forEach.call(document.images, function (img) {
            if (img.loading !== "lazy" && !overlay.contains(img)) trackImage(img);
        });
        Array.prototype.forEach.call(document.querySelectorAll("video"), trackVideo);
        if (document.fonts && document.fonts.ready) {
            var setFonts = addTask(1);
            document.fonts.ready.then(function () { setFonts(1); }, function () { setFonts(1); });
        }
        ((script.dataset.images || "").split(",")).forEach(function (src) {
            if (!src) return;
            var img = new Image();
            trackImage(img);
            img.src = src;
        });
        scanned = true;
        refresh();
    }

    setTimeout(finish, MAX_WAIT_MS);
    // Si vuelven con el botón "atrás", la página ya está lista.
    window.addEventListener("pageshow", function (e) { if (e.persisted) finish(); });

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scanPage);
    else scanPage();

    window.ShellsLoader = {
        wait: function (promise) {
            var set = addTask(1);
            Promise.resolve(promise).then(function () { set(1); }, function () { set(1); });
        }
    };
})();
