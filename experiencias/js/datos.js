/* ============================================================
   Datos de ejemplo (borrador v3: territorio + experiencias).
   Los nombres de territorios vienen del boceto del equipo; TODO el
   contenido es de ejemplo y no describe hechos ni personas reales.
   Se carga como script (y no como .json) para que el mock funcione
   también abriendo index.html con doble clic (file://).
   ============================================================ */
(function () {
  'use strict';
  const e = url => TA.parseEmbed(url);
  const A = {
    ana:   { slug: 'ana-ejemplo',   nombre: 'Ana Ejemplo' },
    bruno: { slug: 'bruno-ejemplo', nombre: 'Bruno Ejemplo' },
    carla: { slug: 'carla-ejemplo', nombre: 'Carla Ejemplo' },
    diego: { slug: 'diego-ejemplo', nombre: 'Diego Ejemplo' },
  };
  const YT1 = 'https://www.youtube.com/watch?v=_KS2o-W1KqI';
  const YT2 = 'https://www.youtube.com/watch?v=14LPSy__GBY';
  const YT3 = 'https://www.youtube.com/watch?v=4ywd2zo4DZ8';
  const SP1 = 'https://open.spotify.com/episode/3iBgOQkOSvz792H939qWur';
  const T = '<p>Texto de ejemplo. ';
  const fotos = n => Array.from({ length: n }, (_, i) => ({ url: 'mock:foto', alt: 'Fotografía de ejemplo ' + (i + 1) }));

  /** Semillas de comunas (centro aproximado). En producción: GeoJSON real de la RM. */
  const COMUNAS = [
    { nombre: 'Conchalí', lat: -33.383, lng: -70.675 },
    { nombre: 'Renca', lat: -33.405, lng: -70.728 },
    { nombre: 'Recoleta', lat: -33.405, lng: -70.642 },
    { nombre: 'Independencia', lat: -33.416, lng: -70.666 },
    { nombre: 'Cerro Navia', lat: -33.423, lng: -70.744 },
    { nombre: 'Quinta Normal', lat: -33.428, lng: -70.700 },
    { nombre: 'Providencia', lat: -33.431, lng: -70.611 },
    { nombre: 'Lo Prado', lat: -33.444, lng: -70.725 },
    { nombre: 'Santiago', lat: -33.450, lng: -70.657 },
    { nombre: 'Ñuñoa', lat: -33.456, lng: -70.597 },
    { nombre: 'Estación Central', lat: -33.462, lng: -70.700 },
    { nombre: 'Peñalolén', lat: -33.484, lng: -70.540 },
    { nombre: 'Macul', lat: -33.488, lng: -70.598 },
    { nombre: 'Pedro Aguirre Cerda', lat: -33.490, lng: -70.675 },
    { nombre: 'San Miguel', lat: -33.497, lng: -70.651 },
    { nombre: 'San Joaquín', lat: -33.495, lng: -70.627 },
    { nombre: 'Maipú', lat: -33.510, lng: -70.757 },
    { nombre: 'La Florida', lat: -33.530, lng: -70.582 },
  ];

  /** Ficha vacía: misma forma para el territorio y para cada experiencia. */
  const ficha = o => Object.assign({
    resumen: '', caracterizacion: '', fotos: [], vistas: [], vista_mapa: null,
    imagen_base: null, relaciones_imagen: null, linea_imagen: null, video: null,
    informe: '', relatos: [],
  }, o);
  const territorio = o => Object.assign(ficha({ portada: null, autores: [], creditos: '', recursos: [], experiencias: [] }), o);
  const enPreparacion = (id, slug, titulo, anio) => territorio({ id, slug, titulo, anio, resumen: 'Portafolio en preparación.' });

  const portafolios = [
    /* ---------- 2026: el ejemplo del boceto ---------- */
    territorio({
      id: 100, slug: 'la-victoria', titulo: 'La Victoria', anio: '2026',
      resumen: 'Texto breve con la caracterización del territorio (ejemplo).',
      caracterizacion: T + 'Caracterización general del territorio: ubicación, historia y vida comunitaria.</p>',
      fotos: fotos(3),
      vistas: ['mapa', 'relaciones', 'video', 'linea'],
      relaciones_imagen: { url: 'mock:relaciones', ancho: 1600, alto: 1000, alt: 'Mapa de relaciones entre actores del territorio (ejemplo)' },
      linea_imagen: { url: 'mock:linea', ancho: 1800, alto: 700, alt: 'Línea de tiempo elaborada por el grupo (ejemplo)' },
      video: e(YT1),
      autores: [A.ana, A.bruno, A.carla],
      creditos: 'Curso de ejemplo · Escuela de Periodismo, Universidad de Chile · 2026.',
      recursos: [
        { id: 901, titulo: 'Informe del grupo', descripcion: 'Documento completo entregado por el grupo.', url: 'https://example.org/informe', portafolio: 100 },
        { id: 902, titulo: 'Registro del territorio', descripcion: 'Carpeta externa con fotos y entrevistas.', url: 'https://example.org/registro', portafolio: 100 },
      ],
      relatos: [
        { id: 1001, titulo: 'Relato de ejemplo: la feria', capa: 'recuerdos', texto: T + 'Un recuerdo de la vida en el territorio.</p>',
          fecha: null, mapa: { lat: -33.4842, lng: -70.6712 }, imagen: null, embed: null, relaciones: [1101], autores: [A.ana] },
        { id: 1002, titulo: 'Relato de ejemplo: la plaza', capa: 'iniciativas', texto: T + 'Una iniciativa comunitaria del sector.</p>',
          fecha: null, mapa: { lat: -33.4868, lng: -70.6740 }, imagen: null, embed: e(YT2), relaciones: [], autores: [A.bruno] },
      ],
      experiencias: [
        ficha({
          id: 110, slug: 'senal-3', titulo: 'Señal 3',
          resumen: 'Texto breve de la experiencia (ejemplo).',
          caracterizacion: T + 'Caracterización general de la experiencia comunicativa: quiénes la hacen, desde cuándo y para quién.</p>',
          fotos: fotos(4),
          vistas: ['caracterizacion', 'trayectorias', 'linea', 'mapa'],
          relatos: [
            { id: 1101, titulo: 'Trayectoria de ejemplo 1', capa: 'trayectorias-de-vida', texto: T + 'Entrevista a una integrante de la experiencia.</p>',
              fecha: { inicio: '1983', fin: '1990' }, mapa: { lat: -33.4851, lng: -70.6725 }, imagen: null, embed: e(YT1), relaciones: [1001], autores: [A.ana] },
            { id: 1102, titulo: 'Trayectoria de ejemplo 2', capa: 'trayectorias-de-vida', texto: T + 'Entrevista en audio.</p>',
              fecha: { inicio: '1997', fin: null }, mapa: null, imagen: null, embed: e(SP1), relaciones: [], autores: [A.carla] },
            { id: 1103, titulo: 'Hito de ejemplo', capa: 'iniciativas', texto: T + 'Un momento clave de la experiencia.</p>',
              fecha: { inicio: '2005-06', fin: null }, mapa: { lat: -33.4860, lng: -70.6700 }, imagen: null, embed: null, relaciones: [1101], autores: [A.carla] },
          ],
        }),
        ficha({
          id: 120, slug: 'primero-de-mayo', titulo: '1° de Mayo',
          resumen: 'Texto breve de la experiencia (ejemplo).',
          caracterizacion: T + 'Caracterización general de la segunda experiencia del territorio.</p>',
          fotos: fotos(2),
          vistas: ['caracterizacion', 'trayectorias', 'linea'],
          relatos: [
            { id: 1201, titulo: 'Trayectoria de ejemplo 3', capa: 'trayectorias-de-vida', texto: T + 'Testimonio de una persona que participó.</p>',
              fecha: { inicio: '1988', fin: '2001' }, mapa: null, imagen: null, embed: e(YT3), relaciones: [1101], autores: [A.bruno] },
            { id: 1202, titulo: 'Recuerdo de ejemplo', capa: 'recuerdos', texto: T + 'Un recuerdo compartido.</p>',
              fecha: { inicio: '1992', fin: null }, mapa: null, imagen: null, embed: null, relaciones: [], autores: [A.bruno] },
          ],
        }),
      ],
    }),
    enPreparacion(101, 'curico', 'Curicó', '2026'),
    enPreparacion(102, 'santiago-centro', 'Santiago centro', '2026'),
    enPreparacion(103, 'barrio-huemul', 'Barrio Huemul', '2026'),
    enPreparacion(104, 'penaflor', 'Peñaflor', '2026'),
    enPreparacion(105, 'penalolen', 'Peñalolén', '2026'),
    enPreparacion(106, 'san-miguel', 'San Miguel', '2026'),
    enPreparacion(107, 'nunoa', 'Ñuñoa', '2026'),

    /* ---------- 2025: ejemplos ficticios con más contenido ---------- */
    territorio({
      id: 10, slug: 'barrio-yungay', titulo: 'Barrio Yungay (ejemplo)', anio: '2025',
      resumen: 'Ejemplo ficticio: memoria de radios, cine-clubs y prensa vecinal.',
      caracterizacion: T + 'Aquí el grupo presenta el territorio y por qué lo eligió.</p>',
      vistas: ['caracterizacion', 'mapa', 'linea', 'imagen', 'multimedia'],
      imagen_base: { url: 'mock:ilustracion', ancho: 1600, alto: 900, alt: 'Ilustración de un barrio con una antena de radio' },
      autores: [A.ana, A.bruno], creditos: 'Curso de ejemplo · 2025.',
      recursos: [{ id: 301, titulo: 'Pauta de entrevistas', descripcion: 'Preguntas usadas en terreno.', url: 'https://example.org/pauta', portafolio: 10 }],
      relatos: [
        { id: 101, titulo: 'Fundación de una radio comunitaria', capa: 'iniciativas', texto: '<p>Vecinas y vecinos levantan una radio de baja potencia para cubrir la vida del barrio.</p>',
          fecha: { inicio: '1992', fin: null }, mapa: { lat: -33.4352, lng: -70.6801 }, imagen: { x: .30, y: .42 }, embed: null, relaciones: [104, 201], autores: [A.ana] },
        { id: 102, titulo: 'Cine-club del sindicato', capa: 'recuerdos', texto: '<p>Cine los viernes en el galpón del sindicato, con sábanas por telón.</p>',
          fecha: { inicio: '1968', fin: '1973-09' }, mapa: { lat: -33.4405, lng: -70.6650 }, imagen: { x: .55, y: .66 }, embed: e(YT1), relaciones: [], autores: [A.bruno] },
        { id: 103, titulo: 'Estudio abierto en la plaza', capa: 'iniciativas', texto: '<p>Un estudio desmontable que graba en ferias y plazas.</p>',
          fecha: { inicio: '2024-04', fin: null }, mapa: { lat: -33.4371, lng: -70.6712 }, imagen: { x: .50, y: .55 }, embed: e(YT2), relaciones: [101], autores: [A.ana] },
        { id: 104, titulo: 'Testimonio: la radio en dictadura', capa: 'trayectorias-de-vida', texto: '<p>Una locutora recuerda la radio que cambiaba de casa cada semana.</p>',
          fecha: { inicio: '1980', fin: '1990-03' }, mapa: { lat: -33.4330, lng: -70.6745 }, imagen: { x: .72, y: .32 }, embed: e(SP1), relaciones: [101], autores: [A.bruno] },
      ],
    }),
    territorio({
      id: 20, slug: 'sector-norte', titulo: 'Sector norte (ejemplo)', anio: '2025',
      resumen: 'Ejemplo ficticio: prensa poblacional y locutoras populares.',
      caracterizacion: T + 'Un territorio que cruza tres comunas.</p>',
      informe: '<h3>Informe del grupo</h3><p>Texto de ejemplo del informe completo. Al vivir en el contenido de WordPress, el buscador del sitio lo encuentra.</p>',
      vistas: ['caracterizacion', 'mapa', 'linea', 'texto'],
      autores: [A.carla], creditos: 'Curso de ejemplo · 2025.',
      relatos: [
        { id: 201, titulo: 'Red de prensa poblacional', capa: 'iniciativas', texto: '<p>Boletines mimeografiados que circulaban de mano en mano.</p>',
          fecha: { inicio: '1983', fin: '1989' }, mapa: { lat: -33.4060, lng: -70.7270 }, imagen: null, embed: null, relaciones: [101, 202], autores: [A.carla] },
        { id: 202, titulo: 'Una locutora popular', capa: 'trayectorias-de-vida', texto: '<p>Tres décadas de radio comunitaria.</p>',
          fecha: { inicio: '1985', fin: '2015' }, mapa: { lat: -33.4170, lng: -70.6630 }, imagen: null, embed: e(SP1), relaciones: [201], autores: [A.carla] },
      ],
    }),
    territorio({
      id: 30, slug: 'cine-movil', titulo: 'Ruta del cine móvil (ejemplo)', anio: '2025',
      resumen: 'Ejemplo ficticio de un trabajo centrado en entrevistas e informe.',
      informe: '<h3>Informe del grupo</h3><p>Texto de ejemplo. Un trabajo que es sobre todo informe y entrevistas también tiene su lugar.</p>',
      vistas: ['trayectorias', 'linea', 'texto'],
      autores: [A.diego], creditos: 'Curso de ejemplo · 2025.',
      relatos: [
        { id: 501, titulo: 'El cine llegaba en camión', capa: 'recuerdos', texto: '<p>Un proyector recorría poblaciones y fundos.</p>',
          fecha: { inicio: '1966', fin: '1972' }, mapa: { lat: -33.5110, lng: -70.7580 }, imagen: null, embed: e(YT3), relaciones: [102], autores: [A.diego] },
        { id: 502, titulo: 'El proyectorista', capa: 'trayectorias-de-vida', texto: '<p>Entrevista al hijo de un proyectorista.</p>',
          fecha: { inicio: '1970', fin: null }, mapa: null, imagen: null, embed: e(YT1), relaciones: [501], autores: [A.diego] },
      ],
    }),
  ];

  const recursosGenerales = [
    { id: 401, titulo: 'Sube tu audio', descripcion: 'Formulario para que la comunidad envíe la historia de su medio.', url: 'https://example.org/sube-tu-audio', portafolio: null },
    { id: 402, titulo: 'Guía de entrevista para estudiantes', descripcion: 'Material del taller de mapeo.', url: 'https://example.org/guia', portafolio: null },
    { id: 403, titulo: 'Cómo enlazar audio y video', descripcion: 'Paso a paso para subir a YouTube o Spotify y pegar el enlace.', url: 'https://example.org/embeds', portafolio: null },
  ];

  window.TA_DATOS = { COMUNAS, portafolios, recursosGenerales, ficha };
})();
