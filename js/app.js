/* ============================================================
   App: navegación por hash, pantallas y playground.
   ============================================================ */
(function () {
  'use strict';
  const esc = TA.esc;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const D = window.TA_DATOS;
  const CAPAS = Object.keys(TA.CAPAS);

  /* ---------- tema ---------- */
  const root = document.documentElement;
  $('#themeBtn').addEventListener('click', () => {
    root.setAttribute('data-theme', V.tema() === 'dark' ? 'light' : 'dark');
    render();
  });

  /* ---------- filtro de capas (chips reutilizables) ---------- */
  function chips(activas, onChange) {
    const el = document.createElement('div');
    el.className = 'layerfilter';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', 'Filtrar por capa');
    el.innerHTML = CAPAS.map(c => {
      const k = TA.CAPAS[c].corto, on = activas.includes(c);
      return '<button type="button" class="chk ' + k + ' ' + (on ? 'on' : 'off') + '" data-l="' + c + '" aria-pressed="' + on + '"><span class="dot"></span>' + esc(TA.CAPAS[c].nombre) + '</button>';
    }).join('');
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-l]'); if (!b) return;
      const c = b.dataset.l;
      const nuevas = activas.includes(c) ? activas.filter(x => x !== c) : activas.concat(c);
      onChange(nuevas);
    });
    return el;
  }

  /* ---------- router ---------- */
  const PANTALLAS = ['inicio', 'territorios', 'portafolio', 'trenza', 'conocenos', 'podcast', 'recursos', 'noticias', 'playground'];
  function ruta() {
    const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    if (!p.length) return { pantalla: 'inicio' };
    if (p[0] === 'territorios' && p[1]) return { pantalla: 'portafolio', slug: p[1], relato: p[2] ? +p[2] : null };
    if (p[0] === 'vista-previa') return { pantalla: 'portafolio', previa: true };
    return { pantalla: PANTALLAS.includes(p[0]) ? p[0] : 'inicio' };
  }
  let vistaPrevia = '';
  function mostrar(pantalla) {
    PANTALLAS.forEach(s => $('#s-' + s).classList.toggle('on', s === pantalla));
    const nav = pantalla === 'portafolio' ? (ruta().previa ? 'playground' : 'territorios') : pantalla;
    $$('#nav a').forEach(a => { const on = a.dataset.s === nav; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  }
  async function render() {
    const r = ruta();
    mostrar(r.pantalla);
    // volver arriba solo al cambiar de pantalla o de portafolio
    const vista = r.pantalla + ':' + (r.slug || (r.previa ? 'previa' : ''));
    if (vista !== vistaPrevia) window.scrollTo(0, 0);
    vistaPrevia = vista;
    if (r.pantalla === 'inicio') renderInicio();
    else if (r.pantalla === 'territorios') await renderTerritorios();
    else if (r.pantalla === 'portafolio') await renderPortafolio(r);
    else if (r.pantalla === 'trenza') await renderTrenza();
    else if (r.pantalla === 'recursos') await renderRecursos();
    else if (r.pantalla === 'playground') renderPlayground();
  }
  window.addEventListener('hashchange', render);
  // redibujar solo si cambia el ancho (en móvil, la barra de URL dispara resize al hacer scroll)
  let rz, anchoPrevio = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { if (window.innerWidth !== anchoPrevio) { anchoPrevio = window.innerWidth; render(); } }, 200);
  });

  /* ---------- INICIO ---------- */
  async function renderInicio() {
    const rel = await API.relatos();
    V.indice($('#heroArt'), { comunas: D.COMUNAS, relatos: rel, decorativo: true, alto: $('#heroArt').clientHeight || 380 });
  }

  /* ---------- TERRITORIOS (índice) ---------- */
  const estIndice = { capas: CAPAS.slice(), q: '' };
  async function renderTerritorios() {
    const [pfs, rel] = await Promise.all([API.portafolios(), API.relatos()]);
    const f = $('#idxFiltros'); f.innerHTML = '';
    f.appendChild(chips(estIndice.capas, n => { estIndice.capas = n; renderTerritorios(); }));
    V.indice($('#idxMapa'), {
      comunas: D.COMUNAS, relatos: rel.filter(r => estIndice.capas.includes(r.capa)),
      portafolios: pfs, capasActivas: estIndice.capas, onPortafolio: s => { location.hash = '#/territorios/' + s; },
    });
    const q = TA.normalizar(estIndice.q);
    const lista = pfs.filter(p => !q || TA.normalizar([p.titulo, p.resumen, p.anio].concat(p.autores.map(a => a.nombre)).join(' ')).includes(q));
    $('#idxCuenta').textContent = lista.length + ' de ' + pfs.length + ' portafolios';
    $('#idxLista').innerHTML = lista.map(p => {
      const total = Object.values(p.conteo).reduce((a, b) => a + b, 0);
      return '<a class="card pf-card" href="#/territorios/' + esc(p.slug) + '"><span class="kick mono">' + esc(p.anio) + ' · ' + total + ' relato' + (total === 1 ? '' : 's') + '</span>' +
        '<h3>' + esc(p.titulo) + '</h3><p>' + esc(p.resumen) + '</p>' +
        '<div class="conteo">' + CAPAS.map(c => '<span title="' + esc(TA.CAPAS[c].nombre) + '"><i style="background:var(--c-' + TA.CAPAS[c].corto + ')"></i>' + p.conteo[c] + '</span>').join('') + '</div>' +
        '<p class="byline">' + p.autores.map(a => esc(a.nombre)).join(', ') + '</p></a>';
    }).join('') || '<p class="empty-note">Ningún portafolio coincide con la búsqueda.</p>';
  }
  $('#idxBuscar').addEventListener('input', e => { estIndice.q = e.target.value; renderTerritorios(); });

  /* ---------- PORTAFOLIO ---------- */
  const estPf = { slug: null, tab: null, sel: null, capas: CAPAS.slice() };
  async function renderPortafolio(r) {
    const pf = r.previa ? API.vistaPrevia(borradorAPortafolio()) : await API.portafolio(r.slug);
    const cont = $('#s-portafolio');
    if (!pf) { cont.innerHTML = '<p class="eyebrow">Territorios</p><h1 class="h1">Portafolio no encontrado</h1><p><a href="#/territorios">← Volver al índice</a></p>'; return; }
    const clave = r.previa ? '__previa' : pf.slug;
    if (estPf.slug !== clave) { estPf.slug = clave; estPf.tab = null; estPf.sel = null; estPf.capas = CAPAS.slice(); }
    if (r.relato) { estPf.sel = r.relato; const rr = pf.relatos.find(x => x.id === r.relato); if (rr && !estPf.tab) estPf.tab = rr.mapa && pf.secciones.includes('mapa') ? 'mapa' : pf.secciones.includes('linea') ? 'linea' : null; }
    if (!pf.secciones.includes(estPf.tab)) estPf.tab = pf.secciones[0] || null;

    cont.innerHTML =
      (r.previa ? '<div class="pg-banner"><b>Vista previa del borrador.</b> Así se verá tu portafolio al publicarse. <a href="#/playground">← Volver al editor</a></div>' : '<p class="eyebrow"><a href="#/territorios">Territorios</a> · ' + esc(pf.anio || '') + '</p>') +
      '<header class="pf-head"><h1 class="h1">' + esc(pf.titulo || 'Sin título') + '</h1>' + (pf.resumen ? '<p class="lead">' + esc(pf.resumen) + '</p>' : '') + '</header>' +
      (pf.secciones.length ? '<div class="tabs" role="tablist" aria-label="Secciones del portafolio">' + pf.secciones.map(s =>
        '<button role="tab" id="tab-' + s + '" aria-controls="tabpanel" aria-selected="' + (s === estPf.tab) + '" tabindex="' + (s === estPf.tab ? 0 : -1) + '" data-tab="' + s + '">' + esc(TA.etiquetaSeccion(s)) + '</button>').join('') + '</div>' : '') +
      '<div class="pf-grid"><div id="tabpanel" role="tabpanel" aria-labelledby="tab-' + esc(estPf.tab || '') + '"></div>' +
      '<aside class="pf-aside">' +
      '<section class="card side"><h4>Recursos</h4>' + (pf.recursos.length ? '<ul class="rec-list">' + pf.recursos.map(x => '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.titulo) + '</a><span>' + esc(x.descripcion || '') + '</span></li>').join('') + '</ul>' : '<p class="muted small">Sin recursos aún.</p>') + '</section>' +
      '<section class="card side"><h4>Créditos</h4>' + (pf.autores.length ? '<ul class="autores">' + pf.autores.map(a => '<li>' + esc(a.nombre) + '</li>').join('') + '</ul>' : '') + (pf.creditos ? '<p class="muted small">' + esc(pf.creditos) + '</p>' : '') + '</section>' +
      '</aside></div>';

    const tabs = $('.tabs', cont);
    if (tabs) {
      tabs.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { estPf.tab = b.dataset.tab; renderPortafolio(r); } });
      tabs.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const i = pf.secciones.indexOf(estPf.tab), n = pf.secciones.length;
        estPf.tab = pf.secciones[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n];
        renderPortafolio(r).then(() => { const b = $('[data-tab="' + estPf.tab + '"]'); b && b.focus(); });
      });
    }
    pintarTab(pf, r);
  }

  function pintarTab(pf, r) {
    const panel = $('#tabpanel');
    const tab = estPf.tab;
    if (!tab) { panel.innerHTML = '<p class="empty-note">Este portafolio aún no tiene secciones con contenido.</p>'; return; }
    if (tab === 'territorio' || tab === 'texto') {
      panel.innerHTML = '<article class="prose card">' + (tab === 'territorio' ? pf.presentacion : pf.informe) + '</article>';
      return;
    }
    const seleccionar = id => {
      const rel = pf.relatos.find(x => x.id === id);
      if (rel) { estPf.sel = id; pintarTab(pf, r); const d = $('#detalle'); d && d.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
      // relación con otro portafolio: saltar
      API.relato(id).then(o => { if (o) location.hash = '#/territorios/' + o.portafolio.slug + '/' + o.id; });
    };
    if (tab === 'multimedia') {
      panel.innerHTML = '<div id="mmCont"></div><div class="detail card" id="detalle"></div>';
      V.multimedia($('#mmCont'), pf.relatos, { onSelect: seleccionar });
      pintarDetalle(pf, seleccionar);
      return;
    }
    panel.innerHTML = '<div id="pfChips"></div><div class="viewport" id="pfVp"></div><div class="detail card" id="detalle"></div>';
    $('#pfChips').appendChild(chips(estPf.capas, n => { estPf.capas = n; pintarTab(pf, r); }));
    const vis = pf.relatos.filter(x => estPf.capas.includes(x.capa));
    const vp = $('#pfVp');
    if (tab === 'mapa') { vp.classList.add('leaflet-vp'); V.mapa(vp, vis, { sel: estPf.sel, vista: pf.vista_mapa, onSelect: seleccionar }); }
    else if (tab === 'linea') V.linea(vp, vis, { sel: estPf.sel, onSelect: seleccionar });
    else if (tab === 'imagen') V.imagen(vp, pf.imagen_base, vis, { sel: estPf.sel, onSelect: seleccionar });
    pintarDetalle(pf, seleccionar);
  }

  async function pintarDetalle(pf, seleccionar) {
    const d = $('#detalle'); if (!d) return;
    const rel = pf.relatos.find(x => x.id === estPf.sel) || null;
    let relacionados = [];
    if (rel) {
      relacionados = await Promise.all(rel.relaciones.map(async id => {
        const local = pf.relatos.find(x => x.id === id);
        if (local) return { id, titulo: local.titulo, capa: local.capa };
        const o = await API.relato(id);
        return o ? { id, titulo: o.titulo, capa: o.capa, otroPortafolio: o.portafolio.titulo } : null;
      })).then(a => a.filter(Boolean));
    }
    d.innerHTML = V.ficha(rel, { comunas: D.COMUNAS, relacionados, vacio: 'Elige un punto para leer su relato, escuchar o ver su multimedia.' });
    $$('[data-jump]', d).forEach(b => b.addEventListener('click', () => seleccionar(+b.dataset.jump)));
  }

  /* ---------- TRENZA DE TIEMPO (general) ---------- */
  const estTrenza = { capas: CAPAS.slice(), portafolio: '' };
  async function renderTrenza() {
    const [pfs, todos] = await Promise.all([API.portafolios(), API.relatos()]);
    const sel = $('#trPf');
    if (sel.options.length <= 1) pfs.forEach(p => { const o = document.createElement('option'); o.value = p.slug; o.textContent = p.titulo; sel.appendChild(o); });
    sel.value = estTrenza.portafolio;
    const f = $('#trFiltros'); f.innerHTML = '';
    f.appendChild(chips(estTrenza.capas, n => { estTrenza.capas = n; renderTrenza(); }));
    const vis = todos.filter(r => estTrenza.capas.includes(r.capa) && (!estTrenza.portafolio || r.portafolio.slug === estTrenza.portafolio));
    V.linea($('#trVp'), vis, { alto: 520, onSelect: id => abrirModal(todos.find(x => x.id === id), todos) });
  }
  $('#trPf').addEventListener('change', e => { estTrenza.portafolio = e.target.value; renderTrenza(); });

  async function abrirModal(r, todos) {
    if (!r) return;
    const full = await API.relato(r.id);
    const relacionados = (r.relaciones || []).map(id => todos.find(x => x.id === id)).filter(Boolean)
      .map(x => ({ id: x.id, titulo: x.titulo, capa: x.capa, otroPortafolio: x.portafolio.slug !== r.portafolio.slug ? x.portafolio.titulo : null }));
    const dlg = $('#modal');
    $('#modalBody').innerHTML = V.ficha(full, { comunas: D.COMUNAS, relacionados, mostrarPortafolio: true });
    $$('[data-jump]', dlg).forEach(b => b.addEventListener('click', () => abrirModal(todos.find(x => x.id === +b.dataset.jump), todos)));
    $$('.pf-link', dlg).forEach(a => a.addEventListener('click', () => dlg.close()));
    // el video se abre directo en el pop-up
    const fac = $('.facade.video', dlg); if (fac) fac.click();
    if (!dlg.open) dlg.showModal();
  }
  $('#modalClose').addEventListener('click', () => $('#modal').close());
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') e.target.close(); });
  $('#modal').addEventListener('close', () => { $('#modalBody').innerHTML = ''; });

  /* ---------- RECURSOS (con buscador) ---------- */
  let qRec = '';
  async function renderRecursos() {
    const todos = await API.recursos();
    const q = TA.normalizar(qRec);
    const lista = todos.filter(x => !q || TA.normalizar([x.titulo, x.descripcion, x.portafolio ? x.portafolio.titulo : 'general'].join(' ')).includes(q));
    $('#recCuenta').textContent = lista.length + ' resultado' + (lista.length === 1 ? '' : 's');
    $('#recGrid').innerHTML = lista.map(x => '<a class="card rc" href="' + esc(x.url) + '" target="_blank" rel="noopener"><span class="kick">' + esc(x.portafolio ? x.portafolio.titulo : 'General') + '</span><h4>' + esc(x.titulo) + '</h4><p>' + esc(x.descripcion || '') + '</p></a>').join('')
      || '<p class="empty-note">No hay recursos que coincidan.</p>';
  }
  $('#recBuscar').addEventListener('input', e => { qRec = e.target.value; renderRecursos(); });

  /* ============================================================
     PLAYGROUND: crear un portafolio
     ============================================================ */
  const KEY = 'ta_playground_v2';
  const vacioBorrador = () => ({ titulo: '', anio: String(new Date().getFullYear()), resumen: '', autores: '', presentacion: '', informe: '', secciones: ['territorio', 'mapa', 'linea'], imagen_base: null, relatos: [], estado: 'borrador' });
  let B = (() => { try { const r = localStorage.getItem(KEY); if (r) return Object.assign(vacioBorrador(), JSON.parse(r)); } catch (e) { /* sin storage */ } return vacioBorrador(); })();
  let avisoStorage = '';
  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(B)); avisoStorage = ''; }
    catch (e) { avisoStorage = 'No se pudo guardar el borrador en este navegador (espacio lleno o modo privado).'; }
  }
  const nuevo = { capa: 'iniciativas', mapa: null, imagen: null };
  let lienzo = 'mapa';

  const slug = s => TA.normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const parrafos = t => String(t || '').split(/\n{2,}|\n/).map(x => x.trim()).filter(Boolean).map(x => '<p>' + esc(x) + '</p>').join('');

  function borradorAPortafolio() {
    const autores = B.autores.split(',').map(x => x.trim()).filter(Boolean).map(n => ({ slug: slug(n), nombre: n }));
    return {
      id: -1, slug: 'borrador', titulo: B.titulo || 'Portafolio sin título', anio: B.anio, resumen: B.resumen,
      presentacion: parrafos(B.presentacion), informe: parrafos(B.informe), secciones: B.secciones.slice(),
      vista_mapa: null, imagen_base: B.imagen_base, portada: null, autores, creditos: '', recursos: [],
      relatos: B.relatos.map(r => Object.assign({}, r, { portafolio: -1, texto: parrafos(r.texto), autores })),
    };
  }

  function renderPlayground() {
    $('#pgTitulo').value = B.titulo; $('#pgAnio').value = B.anio; $('#pgResumen').value = B.resumen;
    $('#pgAutores').value = B.autores; $('#pgPresentacion').value = B.presentacion; $('#pgInforme').value = B.informe;
    pintarSecciones(); pintarImagenInfo(); pintarLista(); pintarLienzo(); pintarUbicacion(); pintarEstado();
  }

  // datos del portafolio
  [['#pgTitulo', 'titulo'], ['#pgAnio', 'anio'], ['#pgResumen', 'resumen'], ['#pgAutores', 'autores'], ['#pgPresentacion', 'presentacion'], ['#pgInforme', 'informe']]
    .forEach(([sel, k]) => $(sel).addEventListener('input', e => { B[k] = e.target.value; guardar(); pintarEstado(); }));

  function pintarSecciones() {
    const llenas = B.secciones.length >= TA.MAX_SECCIONES;
    $('#pgSecciones').innerHTML = TA.SECCIONES.map(s => {
      const on = B.secciones.includes(s.clave);
      return '<label class="sec-chk ' + (on ? 'on' : '') + '"><input type="checkbox" value="' + s.clave + '" ' + (on ? 'checked' : '') + ' ' + (!on && llenas ? 'disabled' : '') + '> ' + esc(s.etiqueta) + '</label>';
    }).join('');
    $('#pgSecCuenta').textContent = B.secciones.length + ' / ' + TA.MAX_SECCIONES;
  }
  $('#pgSecciones').addEventListener('change', e => {
    const v = e.target.value;
    if (e.target.checked) { if (B.secciones.length < TA.MAX_SECCIONES) B.secciones.push(v); }
    else B.secciones = B.secciones.filter(x => x !== v);
    // mantener el orden del catálogo
    B.secciones = TA.SECCIONES.map(s => s.clave).filter(k => B.secciones.includes(k));
    guardar(); pintarSecciones(); pintarEstado();
  });

  // imagen base: se optimiza en el navegador antes de "subir"
  const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';
  async function optimizarImagen(file, max) {
    const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = URL.createObjectURL(file); });
    const esc_ = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * esc_), h = Math.round(img.naturalHeight * esc_);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(img.src);
    let blob = await new Promise(ok => c.toBlob(ok, 'image/webp', .82));
    let tipo = 'WebP';
    if (!blob || blob.type !== 'image/webp') { blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', .85)); tipo = 'JPEG'; }
    const url = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(blob); });
    return { url, ancho: w, alto: h, original: { peso: file.size, ancho: img.naturalWidth, alto: img.naturalHeight }, peso: blob.size, tipo };
  }
  $('#pgImagen').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    if (!/^image\//.test(f.type)) { $('#pgImgInfo').textContent = 'El archivo no es una imagen.'; return; }
    $('#pgImgInfo').textContent = 'Optimizando…';
    try {
      const r = await optimizarImagen(f, 1920);
      B.imagen_base = { url: r.url, ancho: r.ancho, alto: r.alto, alt: B.titulo || 'Imagen base', _info: r.original.ancho + '×' + r.original.alto + ' · ' + kb(r.original.peso) + ' → ' + r.ancho + '×' + r.alto + ' · ' + kb(r.peso) + ' (' + r.tipo + ')' };
      guardar(); pintarImagenInfo(); if (lienzo === 'imagen') pintarLienzo(); pintarEstado();
    } catch (err) { $('#pgImgInfo').textContent = 'No se pudo leer la imagen.'; }
  });
  $('#pgImgQuitar').addEventListener('click', () => { B.imagen_base = null; B.relatos.forEach(r => { r.imagen = null; }); guardar(); pintarImagenInfo(); pintarLienzo(); pintarEstado(); });
  function pintarImagenInfo() {
    $('#pgImgInfo').innerHTML = B.imagen_base ? '<b>Optimizada:</b> ' + esc(B.imagen_base._info || '') : 'Opcional. Se reduce a máx. 1920 px y se convierte a WebP antes de subirla.';
    $('#pgImgQuitar').hidden = !B.imagen_base;
  }

  // nuevo relato
  $('#pgCapa').addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    nuevo.capa = b.dataset.c;
    $$('#pgCapa button').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    pintarLienzo();
  });
  $('#rEmbed').addEventListener('input', () => {
    const v = $('#rEmbed').value.trim(), el = $('#rEmbedEstado');
    if (!v) { el.textContent = 'YouTube, Vimeo, Spotify o SoundCloud.'; el.className = 'hint-line'; return; }
    const p = TA.parseEmbed(v);
    el.textContent = p ? '✓ Enlace de ' + p.tipo + ' reconocido' : '✗ Enlace no admitido. Si es otro tipo de archivo, súbelo como Recurso.';
    el.className = 'hint-line ' + (p ? 'ok' : 'err');
  });
  function pintarUbicacion() {
    $('#rUbic').innerHTML =
      '<span>Mapa: ' + (nuevo.mapa ? '<b>' + nuevo.mapa.lat.toFixed(4) + ', ' + nuevo.mapa.lng.toFixed(4) + '</b> <button type="button" class="x" data-quitar="mapa" aria-label="Quitar ubicación en mapa">✕</button>' : '<i>sin ubicar</i>') + '</span>' +
      '<span>Imagen: ' + (nuevo.imagen ? '<b>' + Math.round(nuevo.imagen.x * 100) + '%, ' + Math.round(nuevo.imagen.y * 100) + '%</b> <button type="button" class="x" data-quitar="imagen" aria-label="Quitar posición en imagen">✕</button>' : '<i>sin ubicar</i>') + '</span>';
  }
  $('#rUbic').addEventListener('click', e => { const b = e.target.closest('[data-quitar]'); if (b) { nuevo[b.dataset.quitar] = null; pintarUbicacion(); pintarLienzo(); } });

  $('#rAgregar').addEventListener('click', () => {
    const errores = [];
    const titulo = $('#rTitulo').value.trim();
    if (!titulo) errores.push('Escribe un título.');
    const fecha = $('#rInicio').value.trim() ? { inicio: $('#rInicio').value.trim(), fin: $('#rFin').value.trim() || null } : null;
    if (fecha) { const ef = TA.validarFecha(fecha); if (ef) errores.push(ef); }
    else if ($('#rFin').value.trim()) errores.push('Para indicar un período, completa también la fecha de inicio.');
    const url = $('#rEmbed').value.trim();
    const emb = url ? TA.parseEmbed(url) : null;
    if (url && !emb) errores.push('El enlace multimedia no es de un proveedor admitido.');
    if (!fecha && !nuevo.mapa && !nuevo.imagen) errores.push('Ancla el relato al menos a una fecha, un lugar del mapa o un punto de la imagen.');
    $('#rErrores').innerHTML = errores.map(x => '<li>' + esc(x) + '</li>').join('');
    if (errores.length) return;
    B.relatos.push({
      id: Date.now(), titulo, capa: nuevo.capa, texto: $('#rTexto').value.trim(), fecha,
      mapa: nuevo.mapa, imagen: nuevo.imagen, embed: emb, relaciones: [],
    });
    ['#rTitulo', '#rTexto', '#rInicio', '#rFin', '#rEmbed'].forEach(s => { $(s).value = ''; });
    $('#rEmbed').dispatchEvent(new Event('input'));
    nuevo.mapa = null; nuevo.imagen = null;
    guardar(); pintarLista(); pintarUbicacion(); pintarLienzo(); pintarEstado();
  });

  function pintarLista() {
    $('#pgLista').innerHTML = B.relatos.length ? B.relatos.map(r =>
      '<li class="pitem"><span class="b" style="background:var(--c-' + TA.CAPAS[r.capa].corto + ')"></span><span class="t">' + esc(r.titulo) + '</span>' +
      '<span class="yr">' + esc(TA.fechaEtiqueta(r.fecha)) + '</span><button type="button" class="x" data-borrar="' + r.id + '" aria-label="Eliminar ' + esc(r.titulo) + '">✕</button></li>').join('')
      : '<li class="muted small">Aún no hay relatos. Agrega el primero ↑</li>';
  }
  $('#pgLista').addEventListener('click', e => {
    const b = e.target.closest('[data-borrar]'); if (!b) return;
    const id = +b.dataset.borrar;
    B.relatos = B.relatos.filter(r => r.id !== id);
    guardar(); pintarLista(); pintarLienzo(); pintarEstado();
  });

  // lienzo
  $('#pgTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    lienzo = b.dataset.f;
    $$('#pgTabs button').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
    pintarLienzo();
  });
  function pintarLienzo() {
    const vp = $('#pgVp'), hint = $('#pgHint');
    vp.classList.toggle('leaflet-vp', lienzo === 'mapa');
    const color = V.capaColor(nuevo.capa);
    if (lienzo === 'mapa') {
      hint.textContent = 'Haz clic en el mapa para ubicar el relato nuevo';
      V.mapa(vp, B.relatos, { marcador: nuevo.mapa, marcadorColor: color, onClickMapa: p => { nuevo.mapa = p; pintarUbicacion(); pintarLienzo(); } });
    } else if (lienzo === 'imagen') {
      hint.textContent = B.imagen_base ? 'Haz clic en la imagen para poner el punto caliente' : 'Primero sube una imagen base (paso 1)';
      V.imagen(vp, B.imagen_base, B.relatos, { marcador: nuevo.imagen, onClickImagen: p => { nuevo.imagen = p; pintarUbicacion(); pintarLienzo(); } });
    } else {
      hint.textContent = 'La línea de tiempo se arma sola con las fechas';
      V.linea(vp, B.relatos, { alto: 400 });
    }
  }

  // estado y envío
  function problemas() {
    const p = [];
    if (!B.titulo.trim()) p.push('El portafolio necesita un título.');
    const es = TA.validarSecciones(B.secciones); if (es) p.push(es);
    if (!B.relatos.length && !B.informe.trim()) p.push('Agrega al menos un relato o el texto del informe.');
    const vis = TA.seccionesVisibles(borradorAPortafolio());
    const vacias = B.secciones.filter(s => !vis.includes(s)).map(TA.etiquetaSeccion);
    if (vacias.length) p.push('Pestañas sin contenido (no se mostrarán): ' + vacias.join(', ') + '.');
    return p;
  }
  function pintarEstado() {
    const p = problemas();
    $('#pgProblemas').innerHTML = (avisoStorage ? '<li>' + esc(avisoStorage) + '</li>' : '') + p.map(x => '<li>' + esc(x) + '</li>').join('');
    const estados = { borrador: 'Borrador', pendiente: 'Pendiente de revisión docente' };
    $('#pgEstado').textContent = estados[B.estado] || 'Borrador';
  }
  $('#pgEnviar').addEventListener('click', () => {
    const bloqueantes = problemas().filter(x => !/^Pestañas sin contenido/.test(x));
    if (bloqueantes.length) { pintarEstado(); $('#pgProblemas').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    B.estado = 'pendiente'; guardar(); pintarEstado();
    $('#pgEnviar').textContent = '✓ Enviado — pendiente de revisión';
    setTimeout(() => { $('#pgEnviar').textContent = 'Enviar a revisión'; }, 2600);
  });
  $('#pgReiniciar').addEventListener('click', () => {
    if (!confirm('¿Borrar el borrador completo? Esta acción no se puede deshacer.')) return;
    B = vacioBorrador(); nuevo.mapa = nuevo.imagen = null; guardar(); renderPlayground();
  });

  /* ---------- init ---------- */
  window.__d3ready = () => { const p = ruta().pantalla; if (p === 'inicio' || p === 'territorios') render(); };
  render();
})();
