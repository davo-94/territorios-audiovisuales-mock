/* ============================================================
   Visores: índice (choropleth), mapa (Leaflet), línea de tiempo,
   imagen interactiva, multimedia y ficha de relato.
   Todos reciben datos con la forma del contrato v2.
   ============================================================ */
(function () {
  'use strict';
  const esc = TA.esc;
  const root = document.documentElement;
  const css = v => getComputedStyle(root).getPropertyValue(v).trim();
  const capaVar = capa => '--c-' + (TA.CAPAS[capa] ? TA.CAPAS[capa].corto : 'ini');
  const capaColor = capa => css(capaVar(capa));

  function tema() {
    return root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
  function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; }

  /** Hace clicables y accesibles por teclado los elementos [data-pid]. */
  function enlazarPuntos(cont, onSelect) {
    cont.querySelectorAll('[data-pid]').forEach(el => {
      const go = () => onSelect && onSelect(+el.dataset.pid);
      el.addEventListener('click', ev => { ev.stopPropagation(); go(); });
      el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } });
    });
  }

  /* ---------- ÍNDICE: choropleth de comunas (Voronoi) ---------- */
  function indice(cont, opt) {
    const W = Math.max(cont.clientWidth || 640, 300), H = opt.alto || 460, pad = 22;
    const comunas = opt.comunas;
    const lats = comunas.map(c => c.lat), lngs = comunas.map(c => c.lng);
    const minLat = Math.min(...lats) - .02, maxLat = Math.max(...lats) + .02;
    const minLng = Math.min(...lngs) - .02, maxLng = Math.max(...lngs) + .02;
    const k = Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
    const sx = (W - 2 * pad) / ((maxLng - minLng) * k), sy = (H - 2 * pad) / (maxLat - minLat);
    const s = Math.min(sx, sy);
    const ox = (W - (maxLng - minLng) * k * s) / 2, oy = (H - (maxLat - minLat) * s) / 2;
    const P = (lat, lng) => [ox + (lng - minLng) * k * s, oy + (maxLat - lat) * s];

    const rel = opt.relatos.filter(r => r.mapa);
    const cuenta = {};
    rel.forEach(r => { const c = TA.comunaMasCercana(r.mapa, comunas); cuenta[c] = (cuenta[c] || 0) + 1; });
    const max = Math.max(1, ...Object.values(cuenta));
    const capasOn = opt.capasActivas || [];
    const base = capasOn.length === 1 ? capaColor(capasOn[0]) : css('--accent');
    const surf = css('--surface-2');

    const pts = comunas.map(c => P(c.lat, c.lng));
    let polys = null;
    if (window.d3 && d3.Delaunay) {
      const vor = d3.Delaunay.from(pts).voronoi([2, 2, W - 2, H - 2]);
      polys = comunas.map((c, i) => vor.cellPolygon(i));
    }
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Mapa de comunas coloreadas por cantidad de relatos">';
    comunas.forEach((c, i) => {
      const n = cuenta[c.nombre] || 0;
      const fill = n ? mix(surf, base, .18 + .7 * n / max) : surf;
      const label = esc(c.nombre) + ': ' + n + ' relato' + (n === 1 ? '' : 's');
      if (polys && polys[i]) svg += '<path class="comuna" d="M' + polys[i].map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z" fill="' + fill + '"><title>' + label + '</title></path>';
      else svg += '<circle class="comuna" cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="30" fill="' + fill + '"><title>' + label + '</title></circle>';
      svg += '<text class="comuna-label" x="' + pts[i][0] + '" y="' + pts[i][1] + '" text-anchor="middle" dy="3">' + esc(c.nombre) + '</text>';
    });
    if (!opt.decorativo) {
      (opt.portafolios || []).filter(p => p.centro).forEach(p => {
        const [x, y] = P(p.centro.lat, p.centro.lng);
        svg += '<g class="pf-mark" data-slug="' + esc(p.slug) + '" tabindex="0" role="link" aria-label="Abrir portafolio ' + esc(p.titulo) + '">' +
          '<rect x="' + (x - 7) + '" y="' + (y - 7) + '" width="14" height="14" rx="3" transform="rotate(45 ' + x + ' ' + y + ')"/>' +
          '<text x="' + x + '" y="' + (y - 13) + '" text-anchor="middle">' + esc(p.titulo) + '</text></g>';
      });
    } else {
      rel.forEach(r => { const [x, y] = P(r.mapa.lat, r.mapa.lng); svg += '<circle cx="' + x + '" cy="' + y + '" r="4.5" fill="' + capaColor(r.capa) + '" stroke="#fff" stroke-width="1.5"/>'; });
    }
    svg += '</svg>';
    cont.innerHTML = svg + (opt.decorativo ? '' :
      '<div class="legend"><div class="row"><span class="grad" style="background:linear-gradient(90deg,' + surf + ',' + base + ')"></span>+ relatos</div><div class="row"><span class="dia"></span>portafolio</div></div>' +
      '<div class="vp-note">comunas aproximadas · en producción: GeoJSON RM + Leaflet</div>');
    cont.querySelectorAll('[data-slug]').forEach(el => {
      const go = () => opt.onPortafolio && opt.onPortafolio(el.dataset.slug);
      el.addEventListener('click', go);
      el.addEventListener('keydown', ev => { if (ev.key === 'Enter') go(); });
    });
  }

  /* ---------- MAPA: Leaflet con zoom al territorio ---------- */
  const mapas = new WeakMap();
  function tiles() {
    return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });
  }

  function mapa(cont, relatos, opt) {
    opt = opt || {};
    const previo = mapas.get(cont);
    if (previo) previo.remove();
    cont.innerHTML = '';
    if (!window.L) { cont.innerHTML = '<div class="empty-note">No se pudo cargar el mapa (sin conexión).</div>'; return null; }
    cont.classList.toggle('mapa-oscuro', tema() === 'dark');
    const m = L.map(cont, { scrollWheelZoom: false, zoomControl: true });
    mapas.set(cont, m);
    tiles().addTo(m);
    const con = relatos.filter(r => r.mapa);
    con.forEach(r => {
      const on = r.id === opt.sel;
      const mk = L.circleMarker([r.mapa.lat, r.mapa.lng], {
        radius: on ? 10 : 7, color: '#fff', weight: 2, fillColor: capaColor(r.capa), fillOpacity: .95,
        keyboard: true, title: r.titulo,
      }).addTo(m);
      mk.bindTooltip(esc(r.titulo), { direction: 'top', offset: [0, -6] });
      mk.on('click', ev => { L.DomEvent.stopPropagation(ev); opt.onSelect && opt.onSelect(r.id); });
    });
    if (opt.marcador) {
      L.circleMarker([opt.marcador.lat, opt.marcador.lng], { radius: 9, color: opt.marcadorColor || css('--ink'), weight: 3, fillOpacity: 0, dashArray: '3 3' }).addTo(m);
    }
    const v = opt.vista;
    const encuadrar = () => {
      if (v) m.setView([v.lat, v.lng], v.zoom);
      else if (con.length > 1) m.fitBounds(L.latLngBounds(con.map(r => [r.mapa.lat, r.mapa.lng])), { padding: [40, 40], maxZoom: 16 });
      else if (con.length === 1) m.setView([con[0].mapa.lat, con[0].mapa.lng], 15);
      else m.setView([-33.45, -70.66], 11);
    };
    encuadrar();
    if (opt.onClickMapa) {
      cont.style.cursor = 'crosshair';
      m.on('click', ev => opt.onClickMapa({ lat: +ev.latlng.lat.toFixed(6), lng: +ev.latlng.lng.toFixed(6) }));
    }
    // el contenedor puede cambiar de tamaño al mostrarse: recalcular y volver a encuadrar
    requestAnimationFrame(() => { m.invalidateSize(); encuadrar(); });
    return m;
  }

  /* ---------- LÍNEA DE TIEMPO: carriles por capa, períodos y trenzado ---------- */
  function linea(cont, relatos, opt) {
    opt = opt || {};
    const W = Math.max(cont.clientWidth || 720, 320), H = opt.alto || 440;
    const rel = relatos.filter(r => r.fecha && TA.parseFecha(r.fecha.inicio));
    if (!rel.length) { cont.innerHTML = '<div class="empty-note">Aún no hay relatos con fecha.</div>'; return; }
    const ini = r => TA.fechaANumero(r.fecha.inicio);
    const fin = r => r.fecha.fin ? TA.fechaANumero(r.fecha.fin, true) : ini(r);
    const span0 = Math.min(...rel.map(ini)), span1 = Math.max(...rel.map(fin));
    const rango = Math.max(1, span1 - span0);
    const paso = rango > 60 ? 20 : rango > 25 ? 10 : rango > 10 ? 5 : 1;
    const y0 = Math.floor((span0 - rango * .04) / paso) * paso, y1 = Math.ceil((span1 + rango * .04) / paso) * paso;
    const padL = W < 520 ? 92 : 128, padR = 24, padT = 26, padB = 50;
    const X = y => padL + (y - y0) / (y1 - y0) * (W - padL - padR);
    const capas = Object.keys(TA.CAPAS);
    const laneH = (H - padT - padB) / capas.length;

    // filas dentro de cada carril para que los hitos no se tapen
    const fila = {};
    capas.forEach(c => {
      const fin_fila = [];
      rel.filter(r => r.capa === c).sort((a, b) => ini(a) - ini(b)).forEach(r => {
        const x0 = X(ini(r)), x1 = Math.max(X(fin(r)), x0 + 26);
        let f = fin_fila.findIndex(e => e < x0 - 6);
        if (f === -1) { f = fin_fila.length; fin_fila.push(x1); } else fin_fila[f] = x1;
        fila[r.id] = f;
      });
      fila['_' + c] = Math.max(1, fin_fila.length);
    });
    const Y = r => {
      const li = capas.indexOf(r.capa), n = Math.min(fila['_' + r.capa], 4);
      const sub = laneH / (n + 1);
      return padT + li * laneH + sub * (Math.min(fila[r.id], 3) + 1);
    };

    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Línea de tiempo por capas">';
    capas.forEach((c, i) => {
      const yy = padT + i * laneH;
      s += '<rect x="' + padL + '" y="' + (yy + 2) + '" width="' + (W - padL - padR) + '" height="' + (laneH - 4) + '" rx="8" fill="var(' + capaVar(c) + '-soft)" opacity=".5"/>';
      s += '<text class="lane-lbl" x="12" y="' + (yy + laneH / 2) + '" dy="4" fill="var(' + capaVar(c) + ')">' + esc(W < 520 ? TA.CAPAS[c].nombre.split(' ')[0] : TA.CAPAS[c].nombre) + '</text>';
    });
    for (let y = y0; y <= y1; y += paso) {
      const xx = X(y);
      s += '<line class="axis" x1="' + xx + '" y1="' + (padT - 6) + '" x2="' + xx + '" y2="' + (H - padB) + '" opacity=".35"/><text class="axis-lbl" x="' + xx + '" y="' + (H - padB + 16) + '" text-anchor="middle">' + y + '</text>';
    }
    const porId = new Map(rel.map(r => [r.id, r]));
    rel.forEach(r => (r.relaciones || []).forEach(id => {
      const o = porId.get(id); if (!o || o.id < r.id && (o.relaciones || []).includes(r.id)) return;
      const x1 = X(ini(r)), a = Y(r), x2 = X(ini(o)), b = Y(o), mx = (x1 + x2) / 2;
      s += '<path class="braid" d="M' + x1 + ',' + a + ' C ' + mx + ',' + a + ' ' + mx + ',' + b + ' ' + x2 + ',' + b + '" stroke="var(' + capaVar(r.capa) + ')"/>';
    }));
    rel.forEach(r => {
      const x0 = X(ini(r)), yy = Y(r), on = r.id === opt.sel, col = 'var(' + capaVar(r.capa) + ')';
      s += '<g class="pt ' + (on ? 'sel' : '') + '" data-pid="' + r.id + '" tabindex="0" role="button" aria-label="' + esc(r.titulo + ', ' + TA.fechaEtiqueta(r.fecha)) + '"><title>' + esc(r.titulo) + '</title>';
      if (r.fecha.fin) s += '<rect class="band" x="' + x0 + '" y="' + (yy - 5) + '" width="' + Math.max(4, X(fin(r)) - x0) + '" height="10" rx="5" fill="' + col + '"/>';
      s += '<circle class="halo" cx="' + x0 + '" cy="' + yy + '" r="14" fill="' + col + '"/><circle class="core" cx="' + x0 + '" cy="' + yy + '" r="' + (on ? 8 : 6) + '" fill="' + col + '"/>';
      s += '<text class="axis-lbl" x="' + x0 + '" y="' + (yy - 11) + '" text-anchor="' + (x0 > W - 60 ? 'end' : 'middle') + '" fill="' + col + '" style="font-weight:700">' + esc(TA.fechaEtiqueta(r.fecha)) + '</text></g>';
    });
    s += '</svg>';
    cont.innerHTML = s + '<div class="vp-note">barras = períodos · líneas punteadas = relatos trenzados</div>';
    enlazarPuntos(cont, opt.onSelect);
  }

  /* ---------- IMAGEN INTERACTIVA ---------- */
  function ilustracionMock(w, h) {
    let a = '<g class="line-art">' +
      '<path d="M0 ' + h * .8 + ' H ' + w + '"/>' +
      '<path d="M' + w * .06 + ' ' + h * .8 + ' v-' + h * .28 + ' h ' + w * .14 + ' v ' + h * .28 + '"/>' +
      '<path d="M' + w * .06 + ' ' + h * .52 + ' l ' + w * .07 + ' -' + h * .09 + ' l ' + w * .07 + ' ' + h * .09 + '"/>' +
      '<path d="M' + w * .26 + ' ' + h * .8 + ' v-' + h * .42 + ' h ' + w * .1 + ' v ' + h * .42 + '"/>' +
      '<path d="M' + w * .7 + ' ' + h * .8 + ' v-' + h * .3 + ' h ' + w * .16 + ' v ' + h * .3 + '"/>' +
      '<circle cx="' + w * .52 + '" cy="' + h * .8 + '" r="' + h * .05 + '"/>' +
      '<path d="M' + w * .52 + ' ' + h * .75 + ' v-' + h * .34 + '"/>';
    for (let i = 1; i <= 3; i++) { const r = h * .05 * i + 10; a += '<path d="M' + (w * .52 - r) + ' ' + h * .36 + ' a ' + r + ' ' + r + ' 0 0 1 ' + r * 2 + ' 0" opacity="' + (.5 - i * .1) + '"/>'; }
    return a + '<circle cx="' + w * .44 + '" cy="' + h * .72 + '" r="' + h * .06 + '"/><circle cx="' + w * .63 + '" cy="' + h * .74 + '" r="' + h * .05 + '"/></g>';
  }

  function imagen(cont, base, relatos, opt) {
    opt = opt || {};
    if (!base) { cont.innerHTML = '<div class="empty-note">Este portafolio aún no tiene imagen base.</div>'; return; }
    const w = base.ancho, h = base.alto;
    let s = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(base.alt || 'Imagen interactiva') + '">';
    s += base.url === 'mock:ilustracion'
      ? '<rect width="' + w + '" height="' + h + '" fill="var(--surface)"/>' + ilustracionMock(w, h)
      : '<image href="' + esc(base.url) + '" width="' + w + '" height="' + h + '"/>';
    const r0 = Math.max(w, h) / 90;
    relatos.filter(r => r.imagen).forEach(r => {
      const x = r.imagen.x * w, y = r.imagen.y * h, on = r.id === opt.sel, col = 'var(' + capaVar(r.capa) + ')';
      s += '<g class="hotspot pt ' + (on ? 'sel' : '') + '" data-pid="' + r.id + '" tabindex="0" role="button" aria-label="' + esc(r.titulo) + '"><title>' + esc(r.titulo) + '</title>' +
        '<circle class="halo" cx="' + x + '" cy="' + y + '" r="' + r0 * 2.2 + '" fill="' + col + '"/>' +
        '<circle class="ring" cx="' + x + '" cy="' + y + '" r="' + r0 * (on ? 1.6 : 1.25) + '" stroke="' + col + '" stroke-width="' + r0 * .28 + '"/>' +
        '<circle cx="' + x + '" cy="' + y + '" r="' + r0 * .6 + '" fill="' + col + '" stroke="#fff" stroke-width="' + r0 * .2 + '"/></g>';
    });
    if (opt.marcador) {
      const x = opt.marcador.x * w, y = opt.marcador.y * h;
      s += '<circle cx="' + x + '" cy="' + y + '" r="' + r0 * 1.3 + '" fill="none" stroke="var(--ink)" stroke-width="' + r0 * .3 + '" stroke-dasharray="' + r0 * .5 + ' ' + r0 * .4 + '"/>';
    }
    s += '</svg>';
    cont.innerHTML = s + '<div class="vp-note">puntos calientes sobre la imagen base</div>';
    enlazarPuntos(cont, opt.onSelect);
    if (opt.onClickImagen) {
      const svg = cont.querySelector('svg');
      svg.style.cursor = 'crosshair';
      svg.addEventListener('click', ev => {
        const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
        const q = p.matrixTransform(svg.getScreenCTM().inverse());
        const cl = v => Math.min(1, Math.max(0, +v.toFixed(4)));
        opt.onClickImagen({ x: cl(q.x / w), y: cl(q.y / h) });
      });
    }
  }

  /* ---------- MULTIMEDIA: carga diferida (fachada) ---------- */
  const NOMBRE_EMBED = { youtube: 'YouTube', vimeo: 'Vimeo', spotify: 'Spotify', soundcloud: 'SoundCloud' };
  function embed(e, titulo) {
    if (!e) return '';
    const video = e.tipo === 'youtube' || e.tipo === 'vimeo';
    return '<button type="button" class="facade ' + (video ? 'video' : 'audio') + '" data-embed-src="' + esc(e.src) + '" data-embed-tipo="' + esc(e.tipo) + '" data-embed-title="' + esc(titulo || '') + '">' +
      '<span class="play" aria-hidden="true">▶</span><span><b>Reproducir · ' + esc(NOMBRE_EMBED[e.tipo] || e.tipo) + '</b><span>se carga al hacer clic</span></span></button>';
  }
  // Un solo manejador para todas las fachadas: crea el iframe recién cuando se pide.
  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-embed-src]');
    if (!b) return;
    const tipo = b.dataset.embedTipo, video = tipo === 'youtube' || tipo === 'vimeo';
    const wrap = document.createElement('div');
    wrap.className = 'embed-frame ' + (video ? 'video' : 'audio ' + tipo);
    const f = document.createElement('iframe');
    f.src = b.dataset.embedSrc + (video ? (b.dataset.embedSrc.includes('?') ? '&' : '?') + 'autoplay=1' : '');
    f.title = b.dataset.embedTitle || 'Multimedia';
    f.loading = 'lazy';
    f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    f.allowFullscreen = true;
    wrap.appendChild(f);
    b.replaceWith(wrap);
  });

  function multimedia(cont, relatos, opt) {
    const con = relatos.filter(r => r.embed);
    cont.innerHTML = con.length ? '<div class="mm-grid">' + con.map(r =>
      '<article class="card mm"><span class="tag ' + TA.CAPAS[r.capa].corto + '">' + esc(TA.CAPAS[r.capa].nombre) + '</span>' +
      '<h4>' + esc(r.titulo) + '</h4><p class="mono small">' + esc(TA.fechaEtiqueta(r.fecha)) + '</p>' + embed(r.embed, r.titulo) +
      '<button class="linklike" data-pid="' + r.id + '">Leer relato →</button></article>').join('') + '</div>'
      : '<div class="empty-note">Aún no hay multimedia.</div>';
    enlazarPuntos(cont, opt && opt.onSelect);
  }

  /* ---------- FICHA DE RELATO ---------- */
  function ficha(r, ctx) {
    ctx = ctx || {};
    if (!r) return '<div class="empty"><div>' + esc(ctx.vacio || 'Elige un punto para leer su relato.') + '</div></div>';
    const comuna = r.mapa && ctx.comunas ? TA.comunaMasCercana(r.mapa, ctx.comunas) : null;
    const meta = [TA.fechaEtiqueta(r.fecha), comuna].filter(Boolean).map(esc).join(' · ');
    const rels = (ctx.relacionados || []);
    return '<span class="tag ' + TA.CAPAS[r.capa].corto + '">' + esc(TA.CAPAS[r.capa].nombre) + '</span>' +
      '<h3>' + esc(r.titulo) + '</h3>' +
      (meta ? '<div class="meta"><span class="coords">' + meta + '</span></div>' : '') +
      (ctx.mostrarPortafolio && r.portafolio ? '<a class="pf-link" href="#/territorios/' + esc(r.portafolio.slug) + '/' + r.id + '">Portafolio: ' + esc(r.portafolio.titulo) + ' →</a>' : '') +
      '<div class="txt">' + (r.texto || '<p>' + esc(r.extracto || '') + '</p>') + '</div>' +
      embed(r.embed, r.titulo) +
      (r.autores && r.autores.length ? '<p class="byline">Por ' + r.autores.map(a => esc(a.nombre)).join(', ') + '</p>' : '') +
      (rels.length ? '<div class="related"><div class="lbl">Trenzado con</div>' + rels.map(x =>
        '<button data-jump="' + x.id + '"><span class="b" style="background:var(' + capaVar(x.capa) + ')"></span><span>' + esc(x.titulo) +
        (x.otroPortafolio ? ' <em class="otro">· ' + esc(x.otroPortafolio) + '</em>' : '') + '</span></button>').join('') + '</div>' : '');
  }

  window.V = { indice, mapa, linea, imagen, multimedia, embed, ficha, capaColor, tema };
})();
