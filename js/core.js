/* ============================================================
   Territorios Audiovisuales — lógica pura (sin DOM)
   Implementa las reglas del contrato de datos v2 (docs/contrato-v2.md).
   Se usa en el navegador (window.TA) y en Node para las pruebas.
   ============================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TA = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CAPAS = {
    'iniciativas':          { nombre: 'Iniciativas',          corto: 'ini' },
    'trayectorias-de-vida': { nombre: 'Trayectorias de vida', corto: 'tra' },
    'recuerdos':            { nombre: 'Recuerdos',            corto: 'rec' },
  };

  /** Catálogo fijo de pestañas del portafolio, en su orden por defecto. */
  const SECCIONES = [
    { clave: 'territorio', etiqueta: 'Territorio' },
    { clave: 'mapa',       etiqueta: 'Mapa' },
    { clave: 'linea',      etiqueta: 'Línea de tiempo' },
    { clave: 'imagen',     etiqueta: 'Imagen' },
    { clave: 'multimedia', etiqueta: 'Multimedia' },
    { clave: 'texto',      etiqueta: 'Texto' },
  ];
  const MAX_SECCIONES = 5;

  /* ---------- texto ---------- */

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function normalizar(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  /* ---------- fechas (ISO parcial) ---------- */

  const RE_FECHA = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

  function parseFecha(s) {
    if (typeof s !== 'string') return null;
    const m = RE_FECHA.exec(s.trim());
    if (!m) return null;
    const y = +m[1], mo = m[2] ? +m[2] : null, d = m[3] ? +m[3] : null;
    if (mo !== null && (mo < 1 || mo > 12)) return null;
    if (d !== null) {
      const dias = new Date(Date.UTC(y, mo, 0)).getUTCDate();
      if (d < 1 || d > dias) return null;
    }
    return { y, m: mo, d };
  }

  /** Año decimal. Con `fin`, devuelve el final del período que la fecha cubre. */
  function fechaANumero(s, fin) {
    const f = parseFecha(s);
    if (!f) return null;
    if (f.m === null) return fin ? f.y + 0.999 : f.y;
    const dias = new Date(Date.UTC(f.y, f.m, 0)).getUTCDate();
    if (f.d === null) return f.y + (f.m - 1 + (fin ? 0.999 : 0)) / 12;
    return f.y + (f.m - 1) / 12 + ((f.d - (fin ? 0 : 1)) / dias) / 12;
  }

  function validarFecha(fecha) {
    if (!fecha || !parseFecha(fecha.inicio)) return 'La fecha de inicio no es válida (usa AAAA, AAAA-MM o AAAA-MM-DD).';
    if (fecha.fin === null || fecha.fin === undefined || fecha.fin === '') return null;
    if (!parseFecha(fecha.fin)) return 'La fecha de término no es válida.';
    if (fechaANumero(fecha.fin, true) < fechaANumero(fecha.inicio)) return 'La fecha de término debe ser posterior al inicio.';
    return null;
  }

  function fechaEtiqueta(fecha) {
    if (!fecha || !parseFecha(fecha.inicio)) return '';
    const a = parseFecha(fecha.inicio).y;
    const f = parseFecha(fecha.fin);
    return f && f.y !== a ? a + '–' + f.y : String(a);
  }

  /* ---------- multimedia embebida (lista blanca) ---------- */

  function parseEmbed(input) {
    if (typeof input !== 'string' || !input.trim()) return null;
    let u;
    try { u = new URL(input.trim()); } catch (e) { return null; }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const host = u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
    const parts = u.pathname.split('/').filter(Boolean);
    const url = input.trim();
    const YT_ID = /^[A-Za-z0-9_-]{11}$/;

    if (host === 'youtube.com' || host === 'youtu.be') {
      let id = null;
      if (host === 'youtu.be') id = parts[0];
      else if (parts[0] === 'watch') id = u.searchParams.get('v');
      else if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') id = parts[1];
      if (!id || !YT_ID.test(id)) return null;
      return { tipo: 'youtube', url, src: 'https://www.youtube-nocookie.com/embed/' + id };
    }
    if (host === 'vimeo.com') {
      const id = parts.find(p => /^\d+$/.test(p));
      return id ? { tipo: 'vimeo', url, src: 'https://player.vimeo.com/video/' + id } : null;
    }
    if (host === 'open.spotify.com') {
      const p = parts[0] && /^intl-/.test(parts[0]) ? parts.slice(1) : parts;
      if (!/^(episode|track|show|playlist|album)$/.test(p[0] || '') || !/^[A-Za-z0-9]{22}$/.test(p[1] || '')) return null;
      return { tipo: 'spotify', url, src: 'https://open.spotify.com/embed/' + p[0] + '/' + p[1] };
    }
    if (host === 'soundcloud.com') {
      if (parts.length < 2) return null;
      const limpia = 'https://soundcloud.com/' + parts.map(encodeURIComponent).join('/');
      return { tipo: 'soundcloud', url, src: 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(limpia) };
    }
    return null;
  }

  /* ---------- pestañas del portafolio ---------- */

  function validarSecciones(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return 'Elige al menos una pestaña.';
    const claves = SECCIONES.map(s => s.clave);
    for (const s of arr) if (!claves.includes(s)) return 'La pestaña "' + s + '" no existe en el catálogo.';
    if (new Set(arr).size !== arr.length) return 'Hay pestañas repetidas.';
    if (arr.length > MAX_SECCIONES) return 'Máximo ' + MAX_SECCIONES + ' pestañas por portafolio.';
    return null;
  }

  function vacio(html) { return !html || !String(html).replace(/<[^>]*>/g, '').trim(); }

  /** Pestañas activas que tienen contenido (regla del servidor). */
  function seccionesVisibles(pf) {
    const rel = pf.relatos || [];
    const tiene = {
      territorio: () => !vacio(pf.presentacion),
      mapa:       () => rel.some(r => r.mapa),
      linea:      () => rel.some(r => r.fecha && parseFecha(r.fecha.inicio)),
      imagen:     () => !!pf.imagen_base && rel.some(r => r.imagen),
      multimedia: () => rel.some(r => r.embed),
      texto:      () => !vacio(pf.informe),
    };
    return (pf.secciones || []).filter(s => tiene[s] && tiene[s]());
  }

  function etiquetaSeccion(clave) {
    const s = SECCIONES.find(x => x.clave === clave);
    return s ? s.etiqueta : clave;
  }

  /* ---------- agregados para el índice ---------- */

  function centro(relatos) {
    const pts = (relatos || []).filter(r => r.mapa);
    if (!pts.length) return null;
    return {
      lat: pts.reduce((a, r) => a + r.mapa.lat, 0) / pts.length,
      lng: pts.reduce((a, r) => a + r.mapa.lng, 0) / pts.length,
    };
  }

  function conteoPorCapa(relatos) {
    const out = {};
    Object.keys(CAPAS).forEach(k => { out[k] = 0; });
    (relatos || []).forEach(r => { if (out[r.capa] !== undefined) out[r.capa]++; });
    return out;
  }

  /**
   * Comuna de un punto = semilla más cercana (equivale a caer en su celda de Voronoi).
   * En producción se reemplaza por punto-en-polígono sobre el GeoJSON de comunas.
   */
  function comunaMasCercana(mapa, comunas) {
    if (!mapa || !comunas || !comunas.length) return null;
    const k = Math.cos(mapa.lat * Math.PI / 180);
    let mejor = null, dmin = Infinity;
    comunas.forEach(c => {
      const dx = (c.lng - mapa.lng) * k, dy = c.lat - mapa.lat, d = dx * dx + dy * dy;
      if (d < dmin) { dmin = d; mejor = c.nombre; }
    });
    return mejor;
  }

  return {
    CAPAS, SECCIONES, MAX_SECCIONES,
    esc, normalizar,
    parseFecha, fechaANumero, validarFecha, fechaEtiqueta,
    parseEmbed,
    validarSecciones, seccionesVisibles, etiquetaSeccion,
    centro, conteoPorCapa, comunaMasCercana,
  };
});
