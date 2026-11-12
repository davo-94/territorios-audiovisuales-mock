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
    if (p[0] === 'territorios') {
      const r = { pantalla: 'territorios', slug: p[1] || null, exp: null, relato: null };
      if (p[2] && /^\d+$/.test(p[2])) r.relato = +p[2];
      else if (p[2]) { r.exp = p[2]; if (p[3] && /^\d+$/.test(p[3])) r.relato = +p[3]; }
      return r;
    }
    if (p[0] === 'vista-previa') return { pantalla: 'portafolio', previa: true };
    return { pantalla: PANTALLAS.includes(p[0]) ? p[0] : 'inicio' };
  }
  let vistaPrevia = '';
  function mostrar(r) {
    PANTALLAS.forEach(s => $('#s-' + s).classList.toggle('on', s === r.pantalla));
    const nav = r.previa ? 'playground' : r.pantalla;
    $$('#nav a').forEach(a => { const on = a.dataset.s === nav; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  }
  async function render() {
    const r = ruta();
    mostrar(r);
    // volver arriba solo al cambiar de pantalla
    const vista = r.pantalla + (r.previa ? ':previa' : '');
    if (vista !== vistaPrevia) window.scrollTo(0, 0);
    vistaPrevia = vista;
    if (r.pantalla === 'inicio') renderInicio();
    else if (r.pantalla === 'territorios') await renderTerritorios(r);
    else if (r.pantalla === 'portafolio') renderPrevia();
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

  /* ---------- TERRITORIOS: índice por año + portafolio ---------- */
  const estIdx = { anio: null, q: '', mapa: false, capas: CAPAS.slice() };
  let slugPrevio = null;
  async function renderTerritorios(r) {
    const pfs = await API.portafolios();
    const anios = [...new Set(pfs.map(p => p.anio))].sort().reverse();
    const actual = r.slug && pfs.find(p => p.slug === r.slug);
    if (actual && (slugPrevio !== r.slug)) estIdx.anio = actual.anio;
    if (!anios.includes(estIdx.anio)) estIdx.anio = anios[0];

    $('#idxAnios').innerHTML = anios.map(a => '<button type="button" data-anio="' + esc(a) + '" aria-pressed="' + (a === estIdx.anio) + '">' + esc(a) + '</button>').join('');
    const q = TA.normalizar(estIdx.q);
    const lista = q
      ? pfs.filter(p => TA.normalizar([p.titulo, p.resumen, p.anio].concat(p.autores.map(a => a.nombre), p.experiencias.map(x => x.titulo)).join(' ')).includes(q))
      : pfs.filter(p => p.anio === estIdx.anio);
    $('#idxCuenta').textContent = q ? lista.length + ' resultado' + (lista.length === 1 ? '' : 's') + ' en todos los años' : '';
    $('#idxLista').innerHTML = lista.map(p =>
      '<li><a href="#/territorios/' + esc(p.slug) + '" class="' + (p.slug === r.slug ? 'on' : '') + (p.en_preparacion ? ' prep' : '') + '"' +
      (p.slug === r.slug ? ' aria-current="true"' : '') + (p.en_preparacion ? ' title="En preparación"' : '') + '>' + esc(p.titulo) +
      (q ? ' <span class="mono small muted">' + esc(p.anio) + '</span>' : '') + '</a></li>').join('') || '<li class="muted">Sin resultados.</li>';

    // mapa de territorios (choropleth), opcional
    $('#idxMapaWrap').hidden = !estIdx.mapa;
    $('#idxMapaBtn').setAttribute('aria-expanded', estIdx.mapa);
    $('#idxMapaBtn').textContent = estIdx.mapa ? 'Ocultar mapa de territorios' : 'Ver mapa de territorios';
    if (estIdx.mapa) {
      const rel = await API.relatos();
      const f = $('#idxFiltros'); f.innerHTML = '';
      f.appendChild(chips(estIdx.capas, n => { estIdx.capas = n; renderTerritorios(ruta()); }));
      V.indice($('#idxMapa'), {
        comunas: D.COMUNAS, relatos: rel.filter(x => estIdx.capas.includes(x.capa)),
        portafolios: pfs.filter(p => !p.en_preparacion), capasActivas: estIdx.capas,
        onPortafolio: s => { location.hash = '#/territorios/' + s; },
      });
    }

    $('#previaCard').innerHTML = '';
    const cont = $('#pfCard');
    if (!r.slug) { cont.innerHTML = '<p class="empty-note">Elige un territorio para abrir su portafolio.</p>'; slugPrevio = null; return; }
    const pf = await API.portafolio(r.slug);
    await renderCard(cont, pf, r, false);
    if (slugPrevio !== r.slug) cont.scrollIntoView({ behavior: slugPrevio ? 'smooth' : 'auto', block: 'start' });
    slugPrevio = r.slug;
  }
  $('#idxAnios').addEventListener('click', e => { const b = e.target.closest('[data-anio]'); if (b) { estIdx.anio = b.dataset.anio; renderTerritorios(ruta()); } });
  $('#idxBuscar').addEventListener('input', e => { estIdx.q = e.target.value; renderTerritorios(ruta()); });
  $('#idxMapaBtn').addEventListener('click', () => { estIdx.mapa = !estIdx.mapa; renderTerritorios(ruta()); });

  /* ---------- PORTAFOLIO: fichas (territorio + experiencias) y vistas ---------- */
  const estPf = { clave: null, ficha: '', vista: null, sel: null, capas: CAPAS.slice() };
  const fichaDe = (pf, slug) => slug ? pf.experiencias.find(x => x.slug === slug) : pf;
  const hashFicha = (pf, exp, id) => '#/territorios/' + pf.slug + (exp ? '/' + exp : '') + (id ? '/' + id : '');

  function vistaPara(f, rel) {
    const v = f.vistas;
    if (rel.mapa && v.includes('mapa')) return 'mapa';
    if (rel.fecha && v.includes('linea')) return 'linea';
    if (rel.capa === 'trayectorias-de-vida' && rel.embed && v.includes('trayectorias')) return 'trayectorias';
    if (rel.imagen && v.includes('imagen')) return 'imagen';
    return v.includes('multimedia') && rel.embed ? 'multimedia' : v[0];
  }

  async function renderCard(cont, pf, r, previa) {
    if (!pf) { cont.innerHTML = '<p class="empty-note">Portafolio no encontrado.</p>'; return; }
    const clave = previa ? '__previa' : pf.slug;
    if (estPf.clave !== clave) Object.assign(estPf, { clave, ficha: '', vista: null, sel: null, capas: CAPAS.slice() });
    // ficha pedida por la ruta (o la que contiene al relato pedido)
    let fichaSlug = r.exp || '';
    if (r.relato && !r.exp) { const x = pf.experiencias.find(e => e.relatos.some(y => y.id === r.relato)); if (x) fichaSlug = x.slug; }
    if (!fichaDe(pf, fichaSlug)) fichaSlug = '';
    if (estPf.ficha !== fichaSlug) Object.assign(estPf, { ficha: fichaSlug, vista: null, sel: null });
    const f = fichaDe(pf, fichaSlug);
    if (r.relato) { const rel = f.relatos.find(x => x.id === r.relato); if (rel) { estPf.sel = rel.id; estPf.vista = vistaPara(f, rel); } }
    if (!f.vistas.includes(estPf.vista)) estPf.vista = f.vistas[0] || null;

    const sinContenido = !f.vistas.length && !pf.experiencias.length;
    const fichas = [{ slug: '', titulo: 'El territorio' }].concat(pf.experiencias.map(x => ({ slug: x.slug, titulo: x.titulo })));
    cont.innerHTML =
      '<article class="pfc card">' +
      '<header class="pfc-head"><h2>' + esc(pf.titulo) + '</h2>' + (pf.anio ? '<span class="mono small muted">' + esc(pf.anio) + '</span>' : '') + '</header>' +
      (sinContenido ? '<p class="empty-note">Portafolio en preparación. Pronto se sumará el trabajo de este territorio.</p></article>' :
        (fichas.length > 1 ? '<div class="pfc-tabs" role="tablist" aria-label="Territorio y experiencias">' + fichas.map(x =>
          '<button role="tab" data-ficha="' + esc(x.slug) + '" aria-selected="' + (x.slug === fichaSlug) + '" tabindex="' + (x.slug === fichaSlug ? 0 : -1) + '">' + esc(x.titulo) + '</button>').join('') + '</div>' : '') +
        '<div class="pfc-body">' +
        '<div class="pfc-main">' + (f.resumen ? '<p class="pfc-lead">' + esc(f.resumen) + '</p>' : '') + '<div id="visor" role="tabpanel"></div><div class="detail card" id="detalle" hidden></div></div>' +
        (f.vistas.length ? '<nav class="pfc-vistas" role="tablist" aria-orientation="vertical" aria-label="Vistas">' + f.vistas.map(v =>
          '<button role="tab" data-vista="' + v + '" aria-selected="' + (v === estPf.vista) + '" tabindex="' + (v === estPf.vista ? 0 : -1) + '">' + esc(TA.etiquetaVista(v)) + '</button>').join('') + '</nav>' : '') +
        '</div>' +
        '<footer class="pfc-foot">' +
        '<section><h4>Recursos</h4>' + ((pf.recursos || []).length ? '<ul class="rec-list">' + pf.recursos.map(x => '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.titulo) + '</a><span>' + esc(x.descripcion || '') + '</span></li>').join('') + '</ul>' : '<p class="muted small">Sin recursos aún.</p>') + '</section>' +
        '<section><h4>Créditos</h4>' + (pf.autores.length ? '<p class="autores-line">' + pf.autores.map(a => esc(a.nombre)).join(' · ') + '</p>' : '') + (pf.creditos ? '<p class="muted small">' + esc(pf.creditos) + '</p>' : '') + '</section>' +
        '</footer></article>');
    if (sinContenido) return;

    const irFicha = slug => {
      if (previa) { estPf.ficha = slug; renderCard(cont, pf, { exp: slug }, true); return; }
      location.hash = hashFicha(pf, slug);
    };
    const tabs = $('.pfc-tabs', cont);
    if (tabs) {
      tabs.addEventListener('click', e => { const b = e.target.closest('[data-ficha]'); if (b) irFicha(b.dataset.ficha); });
      tabs.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const i = fichas.findIndex(x => x.slug === fichaSlug), n = fichas.length;
        irFicha(fichas[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n].slug);
        setTimeout(() => { const b = $('[data-ficha="' + estPf.ficha + '"]', cont); b && b.focus(); }, 50);
      });
    }
    const vistas = $('.pfc-vistas', cont);
    if (vistas) {
      vistas.addEventListener('click', e => { const b = e.target.closest('[data-vista]'); if (!b) return; estPf.vista = b.dataset.vista; marcarVista(); pintarVista(pf, f, previa); });
      vistas.addEventListener('keydown', e => {
        if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
        e.preventDefault();
        const i = f.vistas.indexOf(estPf.vista), n = f.vistas.length, adelante = e.key === 'ArrowDown' || e.key === 'ArrowRight';
        estPf.vista = f.vistas[(i + (adelante ? 1 : n - 1)) % n]; marcarVista(); pintarVista(pf, f, previa);
        $('[data-vista="' + estPf.vista + '"]', cont).focus();
      });
    }
    function marcarVista() { $$('[data-vista]', cont).forEach(b => { const on = b.dataset.vista === estPf.vista; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; }); }
    pintarVista(pf, f, previa);
  }

  function pintarVista(pf, f, previa) {
    const visor = $('#visor'), det = $('#detalle');
    det.hidden = true; visor.className = '';
    const v = estPf.vista;
    const seleccionar = id => {
      if (f.relatos.some(x => x.id === id)) { estPf.sel = id; pintarVista(pf, f, previa); det.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
      // relación con otra ficha u otro portafolio: saltar
      if (previa) return;
      API.relato(id).then(o => { if (o) location.hash = '#/territorios/' + o.portafolio.slug + (o.experiencia ? '/' + o.experiencia.slug : '') + '/' + o.id; });
    };
    const conDetalle = () => { det.hidden = false; pintarDetalle(f, seleccionar); };
    const conChips = () => {
      const c = document.createElement('div');
      c.appendChild(chips(estPf.capas, n => { estPf.capas = n; pintarVista(pf, f, previa); }));
      const vp = document.createElement('div'); vp.className = 'viewport'; vp.id = 'pfVp';
      visor.innerHTML = ''; visor.appendChild(c.firstChild); visor.appendChild(vp);
      return { vp, vis: f.relatos.filter(x => estPf.capas.includes(x.capa)) };
    };
    if (!v) { visor.innerHTML = '<p class="empty-note">Esta ficha aún no tiene vistas con contenido.</p>'; return; }
    if (v === 'caracterizacion') { visor.innerHTML = '<div class="prose">' + (f.caracterizacion || '') + '</div>' + V.galeria(f.fotos); return; }
    if (v === 'texto') { visor.innerHTML = '<div class="prose">' + f.informe + '</div>'; return; }
    if (v === 'relaciones') { V.imagenFija(visor, f.relaciones_imagen, 'Mapa de relaciones elaborado por el grupo'); return; }
    if (v === 'video') { visor.innerHTML = V.embed(f.video, f.titulo); const b = $('.facade', visor); if (b) b.classList.add('grande'); return; }
    if (v === 'multimedia' || v === 'trayectorias') {
      const rel = v === 'trayectorias' ? f.relatos.filter(x => x.capa === 'trayectorias-de-vida') : f.relatos;
      V.multimedia(visor, rel, { onSelect: seleccionar }); conDetalle(); return;
    }
    if (v === 'linea' && !f.relatos.some(x => x.fecha && TA.parseFecha(x.fecha.inicio))) {
      V.imagenFija(visor, f.linea_imagen, 'Línea de tiempo elaborada por el grupo'); return;
    }
    const { vp, vis } = conChips();
    if (v === 'mapa') { vp.classList.add('leaflet-vp'); V.mapa(vp, vis, { sel: estPf.sel, vista: f.vista_mapa, onSelect: seleccionar }); }
    else if (v === 'linea') {
      V.linea(vp, vis, { sel: estPf.sel, onSelect: seleccionar });
      if (f.linea_imagen) { const d = document.createElement('details'); d.className = 'linea-img'; d.innerHTML = '<summary>Ver la línea de tiempo del grupo (imagen)</summary><div></div>'; visor.appendChild(d); V.imagenFija(d.lastChild, f.linea_imagen); }
    }
    else if (v === 'imagen') V.imagen(vp, f.imagen_base, vis, { sel: estPf.sel, onSelect: seleccionar });
    conDetalle();
  }

  async function pintarDetalle(f, seleccionar) {
    const d = $('#detalle'); if (!d) return;
    const rel = f.relatos.find(x => x.id === estPf.sel) || null;
    let relacionados = [];
    if (rel) {
      relacionados = await Promise.all(rel.relaciones.map(async id => {
        const local = f.relatos.find(x => x.id === id);
        if (local) return { id, titulo: local.titulo, capa: local.capa };
        const o = await API.relato(id);
        if (!o) return null;
        const mismo = o.portafolio.slug === estPf.clave;
        const donde = mismo ? (o.experiencia ? o.experiencia.titulo : 'El territorio') : o.portafolio.titulo + (o.experiencia ? ' · ' + o.experiencia.titulo : '');
        return { id, titulo: o.titulo, capa: o.capa, otroPortafolio: donde };
      })).then(a => a.filter(Boolean));
    }
    d.innerHTML = V.ficha(rel, { comunas: D.COMUNAS, relacionados, vacio: 'Elige un punto para leer su relato, escuchar o ver su multimedia.' });
    $$('[data-jump]', d).forEach(b => b.addEventListener('click', () => seleccionar(+b.dataset.jump)));
  }

  function renderPrevia() {
    $('#pfCard').innerHTML = ''; slugPrevio = null;
    const pf = API.vistaPrevia(borradorAPortafolio());
    const cont = $('#previaCard');
    renderCard(cont, pf, { exp: estPf.clave === '__previa' ? estPf.ficha : '' }, true);
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
  const vacioBorrador = () => ({ titulo: '', anio: String(new Date().getFullYear()), resumen: '', autores: '', caracterizacion: '', informe: '', vistas: ['caracterizacion', 'mapa', 'linea'], imagen_base: null, relatos: [], estado: 'borrador' });
  let B = (() => { try { const r = localStorage.getItem(KEY); if (r) return Object.assign(vacioBorrador(), JSON.parse(r)); } catch (e) { /* sin storage */ } return vacioBorrador(); })();
  // borradores guardados con el formato anterior (pestañas)
  if (!Array.isArray(B.vistas) || TA.validarVistas(B.vistas) && B.vistas.length) B.vistas = vacioBorrador().vistas;
  if (B.presentacion && !B.caracterizacion) B.caracterizacion = B.presentacion;
  let avisoStorage = '';
  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(B)); avisoStorage = ''; }
    catch (e) { avisoStorage = 'No se pudo guardar el borrador en este navegador (espacio lleno o modo privado).'; }
  }
  const nuevo = { capa: 'iniciativas', mapa: null, imagen: null };
  // vistas que el playground puede llenar hoy (las de imágenes subidas llegan con las experiencias)
  const VISTAS_PG = ['caracterizacion', 'mapa', 'linea', 'trayectorias', 'imagen', 'multimedia', 'texto'];
  let lienzo = 'mapa';

  const slug = s => TA.normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const parrafos = t => String(t || '').split(/\n{2,}|\n/).map(x => x.trim()).filter(Boolean).map(x => '<p>' + esc(x) + '</p>').join('');

  function borradorAPortafolio() {
    const autores = B.autores.split(',').map(x => x.trim()).filter(Boolean).map(n => ({ slug: slug(n), nombre: n }));
    return {
      id: -1, slug: 'borrador', titulo: B.titulo || 'Portafolio sin título', anio: B.anio, resumen: B.resumen,
      caracterizacion: parrafos(B.caracterizacion), fotos: [], informe: parrafos(B.informe), vistas: B.vistas.slice(),
      vista_mapa: null, imagen_base: B.imagen_base, relaciones_imagen: null, linea_imagen: null, video: null,
      portada: null, autores, creditos: '', recursos: [], experiencias: [],
      relatos: B.relatos.map(r => Object.assign({}, r, { portafolio: -1, texto: parrafos(r.texto), autores })),
    };
  }

  function renderPlayground() {
    $('#pgTitulo').value = B.titulo; $('#pgAnio').value = B.anio; $('#pgResumen').value = B.resumen;
    $('#pgAutores').value = B.autores; $('#pgPresentacion').value = B.caracterizacion; $('#pgInforme').value = B.informe;
    pintarSecciones(); pintarImagenInfo(); pintarLista(); pintarLienzo(); pintarUbicacion(); pintarEstado();
  }

  // datos del portafolio
  [['#pgTitulo', 'titulo'], ['#pgAnio', 'anio'], ['#pgResumen', 'resumen'], ['#pgAutores', 'autores'], ['#pgPresentacion', 'caracterizacion'], ['#pgInforme', 'informe']]
    .forEach(([sel, k]) => $(sel).addEventListener('input', e => { B[k] = e.target.value; guardar(); pintarEstado(); }));

  function pintarSecciones() {
    const llenas = B.vistas.length >= TA.MAX_VISTAS;
    $('#pgSecciones').innerHTML = TA.VISTAS.filter(s => VISTAS_PG.includes(s.clave)).map(s => {
      const on = B.vistas.includes(s.clave);
      return '<label class="sec-chk ' + (on ? 'on' : '') + '"><input type="checkbox" value="' + s.clave + '" ' + (on ? 'checked' : '') + ' ' + (!on && llenas ? 'disabled' : '') + '> ' + esc(s.etiqueta) + '</label>';
    }).join('');
    $('#pgSecCuenta').textContent = B.vistas.length + ' / ' + TA.MAX_VISTAS;
  }
  $('#pgSecciones').addEventListener('change', e => {
    const v = e.target.value;
    if (e.target.checked) { if (B.vistas.length < TA.MAX_VISTAS) B.vistas.push(v); }
    else B.vistas = B.vistas.filter(x => x !== v);
    // mantener el orden del catálogo
    B.vistas = TA.VISTAS.map(s => s.clave).filter(k => B.vistas.includes(k));
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
    const es = TA.validarVistas(B.vistas); if (es) p.push(es);
    if (!B.relatos.length && !B.informe.trim()) p.push('Agrega al menos un relato o el texto del informe.');
    const vis = TA.vistasVisibles(borradorAPortafolio());
    const vacias = B.vistas.filter(s => !vis.includes(s)).map(TA.etiquetaVista);
    if (vacias.length) p.push('Vistas sin contenido (no se mostrarán): ' + vacias.join(', ') + '.');
    return p;
  }
  function pintarEstado() {
    const p = problemas();
    $('#pgProblemas').innerHTML = (avisoStorage ? '<li>' + esc(avisoStorage) + '</li>' : '') + p.map(x => '<li>' + esc(x) + '</li>').join('');
    const estados = { borrador: 'Borrador', pendiente: 'Pendiente de revisión docente' };
    $('#pgEstado').textContent = estados[B.estado] || 'Borrador';
  }
  $('#pgEnviar').addEventListener('click', () => {
    const bloqueantes = problemas().filter(x => !/^Vistas sin contenido/.test(x));
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
