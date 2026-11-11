// Pruebas de la lógica pura (js/core.js). Ejecutar: npm test  (Node 18+, sin dependencias)
const test = require('node:test');
const assert = require('node:assert/strict');
const TA = require('../js/core.js');

test('parseFecha acepta ISO parcial y rechaza formatos inválidos', () => {
  assert.deepEqual(TA.parseFecha('1973'), { y: 1973, m: null, d: null });
  assert.deepEqual(TA.parseFecha('1973-09'), { y: 1973, m: 9, d: null });
  assert.deepEqual(TA.parseFecha('1973-09-11'), { y: 1973, m: 9, d: 11 });
  assert.equal(TA.parseFecha('73'), null);
  assert.equal(TA.parseFecha('1973-13'), null);
  assert.equal(TA.parseFecha('1973-02-30'), null);
  assert.equal(TA.parseFecha(''), null);
  assert.equal(TA.parseFecha(null), null);
});

test('fechaANumero ubica inicio y fin dentro del año', () => {
  assert.equal(TA.fechaANumero('1990'), 1990);
  assert.ok(TA.fechaANumero('1990', true) > 1990.99);
  assert.ok(TA.fechaANumero('1973-09') > 1973.6 && TA.fechaANumero('1973-09') < 1973.7);
  assert.equal(TA.fechaANumero('nope'), null);
});

test('validarFecha exige inicio válido y fin >= inicio', () => {
  assert.equal(TA.validarFecha({ inicio: '1973', fin: null }), null);
  assert.equal(TA.validarFecha({ inicio: '1973', fin: '1990' }), null);
  assert.equal(TA.validarFecha({ inicio: '1973-09', fin: '1973' }), null, 'mismo año, menor precisión, es válido');
  assert.match(TA.validarFecha({ inicio: '1990', fin: '1973' }), /posterior/);
  assert.match(TA.validarFecha({ inicio: 'x', fin: null }), /inicio/);
  assert.match(TA.validarFecha({ inicio: '1973', fin: 'x' }), /término/);
});

test('fechaEtiqueta muestra momento o período', () => {
  assert.equal(TA.fechaEtiqueta({ inicio: '1992', fin: null }), '1992');
  assert.equal(TA.fechaEtiqueta({ inicio: '1973-09', fin: '1990-03' }), '1973–1990');
  assert.equal(TA.fechaEtiqueta(null), '');
});

test('parseEmbed reconoce la lista blanca y arma src seguro', () => {
  const yt = TA.parseEmbed('https://www.youtube.com/watch?v=_KS2o-W1KqI&t=10');
  assert.equal(yt.tipo, 'youtube');
  assert.equal(yt.src, 'https://www.youtube-nocookie.com/embed/_KS2o-W1KqI');
  assert.equal(TA.parseEmbed('https://youtu.be/_KS2o-W1KqI').src, yt.src);
  assert.equal(TA.parseEmbed('https://youtube.com/shorts/_KS2o-W1KqI').src, yt.src);

  assert.equal(TA.parseEmbed('https://vimeo.com/76979871').src, 'https://player.vimeo.com/video/76979871');

  const sp = TA.parseEmbed('https://open.spotify.com/intl-es/episode/3iBgOQkOSvz792H939qWur?si=abc');
  assert.equal(sp.tipo, 'spotify');
  assert.equal(sp.src, 'https://open.spotify.com/embed/episode/3iBgOQkOSvz792H939qWur');

  const sc = TA.parseEmbed('https://soundcloud.com/artista/pista?in=x');
  assert.equal(sc.tipo, 'soundcloud');
  assert.equal(sc.src, 'https://w.soundcloud.com/player/?url=' + encodeURIComponent('https://soundcloud.com/artista/pista'));
});

test('parseEmbed rechaza proveedores fuera de la lista y URLs peligrosas', () => {
  assert.equal(TA.parseEmbed('https://example.org/video'), null);
  assert.equal(TA.parseEmbed('javascript:alert(1)'), null);
  assert.equal(TA.parseEmbed('<iframe src="https://youtube.com/embed/x"></iframe>'), null);
  assert.equal(TA.parseEmbed('https://youtube.com.evil.org/watch?v=_KS2o-W1KqI'), null);
  assert.equal(TA.parseEmbed(''), null);
});

test('validarSecciones: solo catálogo, sin repetidos, máximo 5', () => {
  assert.equal(TA.validarSecciones(['territorio', 'mapa']), null);
  assert.match(TA.validarSecciones(['mapa', 'mapa']), /repet/);
  assert.match(TA.validarSecciones(['galeria']), /no existe/);
  assert.match(TA.validarSecciones(['territorio', 'mapa', 'linea', 'imagen', 'multimedia', 'texto']), /5/);
  assert.match(TA.validarSecciones([]), /al menos/);
});

test('seccionesVisibles filtra las pestañas sin contenido y respeta el orden', () => {
  const pf = {
    secciones: ['texto', 'mapa', 'linea', 'imagen', 'territorio'],
    presentacion: '', informe: '<p>x</p>', imagen_base: null,
    relatos: [{ mapa: null, fecha: { inicio: '1990', fin: null }, imagen: { x: .5, y: .5 }, embed: null }],
  };
  assert.deepEqual(TA.seccionesVisibles(pf), ['texto', 'linea']);
});

test('centro y conteoPorCapa resumen un portafolio', () => {
  const rel = [
    { capa: 'iniciativas', mapa: { lat: -33.4, lng: -70.6 } },
    { capa: 'recuerdos', mapa: { lat: -33.6, lng: -70.8 } },
    { capa: 'recuerdos', mapa: null },
  ];
  const c = TA.centro(rel);
  assert.ok(Math.abs(c.lat + 33.5) < 1e-9 && Math.abs(c.lng + 70.7) < 1e-9);
  assert.equal(TA.centro([{ mapa: null }]), null);
  assert.deepEqual(TA.conteoPorCapa(rel), { iniciativas: 1, 'trayectorias-de-vida': 0, recuerdos: 2 });
});

test('comunaMasCercana asigna el punto a la semilla más próxima', () => {
  const comunas = [{ nombre: 'A', lat: -33.4, lng: -70.6 }, { nombre: 'B', lat: -33.6, lng: -70.8 }];
  assert.equal(TA.comunaMasCercana({ lat: -33.41, lng: -70.61 }, comunas), 'A');
  assert.equal(TA.comunaMasCercana({ lat: -33.59, lng: -70.79 }, comunas), 'B');
  assert.equal(TA.comunaMasCercana(null, comunas), null);
});

test('esc neutraliza HTML', () => {
  assert.equal(TA.esc('<img src=x onerror="a">&\''), '&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;');
  assert.equal(TA.esc(null), '');
});

test('normalizar quita tildes y mayúsculas para el buscador', () => {
  assert.equal(TA.normalizar('Ñuñoa CÁMARA'), 'nunoa camara');
});
