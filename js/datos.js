/* ============================================================
   Datos de ejemplo con la forma del contrato v2.
   Contenido ficticio: no representa territorios ni personas reales.
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

  const ilustracion = { url: 'mock:ilustracion', ancho: 1600, alto: 900, alt: 'Ilustración de un barrio con una antena de radio' };

  const portafolios = [
    {
      id: 10, slug: 'barrio-yungay', titulo: 'Barrio Yungay', anio: '2026',
      resumen: 'Memoria de la comunicación popular y comunitaria del barrio: radios, cine-clubs y prensa vecinal.',
      presentacion: '<p>Texto de ejemplo. Aquí el grupo presenta el territorio: su ubicación, su historia breve y por qué lo eligió para el mapeo.</p><p>La presentación admite párrafos, enlaces e imágenes, como cualquier entrada de WordPress.</p>',
      informe: '',
      secciones: ['territorio', 'mapa', 'linea', 'imagen', 'multimedia'],
      vista_mapa: null, imagen_base: ilustracion, portada: null,
      autores: [A.ana, A.bruno],
      creditos: 'Curso de ejemplo · Escuela de Periodismo, Universidad de Chile · 2026.',
      recursos: [
        { id: 301, titulo: 'Pauta de entrevistas', descripcion: 'Preguntas usadas en terreno por el grupo.', url: 'https://example.org/pauta', portafolio: 10 },
        { id: 302, titulo: 'Registro fotográfico', descripcion: 'Carpeta externa con fotos del barrio.', url: 'https://example.org/fotos', portafolio: 10 },
      ],
      relatos: [
        { id: 101, portafolio: 10, titulo: 'Fundación de una radio comunitaria', capa: 'iniciativas',
          texto: '<p>Un grupo de vecinas y vecinos levanta una radio de baja potencia para cubrir las juntas de vecinos y la vida del barrio. La antena, instalada en una azotea, alcanzaba diez cuadras a la redonda.</p>',
          fecha: { inicio: '1992', fin: null }, mapa: { lat: -33.4352, lng: -70.6801 }, imagen: { x: .30, y: .42 },
          embed: null, relaciones: [104, 201], autores: [A.ana] },
        { id: 102, portafolio: 10, titulo: 'Cine-club del sindicato', capa: 'recuerdos',
          texto: '<p>Todos los viernes se proyectaba cine en el galpón del sindicato. Sábanas por telón y un proyector prestado. La memoria de esas funciones sobrevive en los relatos de quienes hoy peinan canas.</p>',
          fecha: { inicio: '1968', fin: '1973-09' }, mapa: { lat: -33.4405, lng: -70.6650 }, imagen: { x: .55, y: .66 },
          embed: e('https://www.youtube.com/watch?v=_KS2o-W1KqI'), relaciones: [], autores: [A.bruno] },
        { id: 103, portafolio: 10, titulo: 'Estudio abierto en la plaza', capa: 'iniciativas',
          texto: '<p>La radio vuelve al espacio público: un estudio desmontable que se instala en ferias y plazas para grabar a quien quiera contar su historia.</p>',
          fecha: { inicio: '2024-04', fin: null }, mapa: { lat: -33.4371, lng: -70.6712 }, imagen: { x: .50, y: .55 },
          embed: e('https://www.youtube.com/watch?v=14LPSy__GBY'), relaciones: [101], autores: [A.ana, A.bruno] },
        { id: 104, portafolio: 10, titulo: 'Testimonio: la radio en dictadura', capa: 'trayectorias-de-vida',
          texto: '<p>Una locutora recuerda los años en que la radio del barrio funcionó a escondidas, cambiando de casa cada semana.</p>',
          fecha: { inicio: '1980', fin: '1990-03' }, mapa: { lat: -33.4330, lng: -70.6745 }, imagen: { x: .72, y: .32 },
          embed: e('https://open.spotify.com/episode/3iBgOQkOSvz792H939qWur'), relaciones: [101], autores: [A.bruno] },
      ],
    },
    {
      id: 20, slug: 'sector-norte', titulo: 'Sector norte', anio: '2026',
      resumen: 'Prensa poblacional y locutoras populares entre Independencia, Recoleta y Renca.',
      presentacion: '<p>Texto de ejemplo. Un territorio que cruza tres comunas, unido por una red de boletines y radios de baja potencia.</p>',
      informe: '<h3>Informe del grupo</h3><p>Texto de ejemplo del informe completo. En la plataforma real, aquí va el texto del informe entregado por el grupo, con sus hallazgos, metodología y conclusiones. Al vivir en el contenido de WordPress, el buscador del sitio lo encuentra.</p><p>Puede tener varios párrafos, citas y enlaces a los recursos.</p>',
      secciones: ['territorio', 'mapa', 'linea', 'texto'],
      vista_mapa: null, imagen_base: null, portada: null,
      autores: [A.carla],
      creditos: 'Curso de ejemplo · 2026.',
      recursos: [
        { id: 303, titulo: 'Boletines digitalizados', descripcion: 'Selección de boletines en un archivo externo.', url: 'https://example.org/boletines', portafolio: 20 },
      ],
      relatos: [
        { id: 201, portafolio: 20, titulo: 'Red de prensa poblacional', capa: 'iniciativas',
          texto: '<p>Cientos de boletines mimeografiados circulando de mano en mano. Un tejido de talleres que sostuvo la palabra propia cuando los medios grandes callaban.</p>',
          fecha: { inicio: '1983', fin: '1989' }, mapa: { lat: -33.4060, lng: -70.7270 }, imagen: null,
          embed: null, relaciones: [101, 202], autores: [A.carla] },
        { id: 202, portafolio: 20, titulo: 'Una locutora popular', capa: 'trayectorias-de-vida',
          texto: '<p>Su voz cruzó tres décadas de radio comunitaria. Empezó leyendo avisos y terminó dirigiendo el noticiero barrial más escuchado del sector.</p>',
          fecha: { inicio: '1985', fin: '2015' }, mapa: { lat: -33.4170, lng: -70.6630 }, imagen: null,
          embed: e('https://open.spotify.com/episode/3iBgOQkOSvz792H939qWur'), relaciones: [201], autores: [A.carla] },
        { id: 203, portafolio: 20, titulo: 'La feria como estudio', capa: 'recuerdos',
          texto: '<p>Grabaciones de pregones y conversaciones en la feria de los domingos, registradas por estudiantes de un liceo del sector.</p>',
          fecha: { inicio: '2003-11-16', fin: null }, mapa: { lat: -33.4045, lng: -70.6415 }, imagen: null,
          embed: null, relaciones: [], autores: [A.carla] },
      ],
    },
    {
      id: 30, slug: 'cine-movil', titulo: 'Ruta del cine móvil', anio: '2025',
      resumen: 'Un camión con proyector que recorría poblaciones y fundos. Trabajo centrado en entrevistas e informe.',
      presentacion: '',
      informe: '<h3>Informe del grupo</h3><p>Texto de ejemplo. Este portafolio muestra un trabajo que es sobre todo informe y entrevistas: no usa mapa ni imagen, y aun así tiene su lugar en la plataforma.</p>',
      secciones: ['linea', 'multimedia', 'texto'],
      vista_mapa: null, imagen_base: null, portada: null,
      autores: [A.diego, A.ana],
      creditos: 'Curso de ejemplo · 2025.',
      recursos: [],
      relatos: [
        { id: 501, portafolio: 30, titulo: 'El cine llegaba en camión', capa: 'recuerdos',
          texto: '<p>Una unidad móvil recorría fundos y poblaciones con un proyector. La llegada del camión era fiesta: se acomodaban sillas y cajones en la cancha.</p>',
          fecha: { inicio: '1966', fin: '1972' }, mapa: { lat: -33.5110, lng: -70.7580 }, imagen: null,
          embed: e('https://www.youtube.com/watch?v=4ywd2zo4DZ8'), relaciones: [102], autores: [A.diego] },
        { id: 502, portafolio: 30, titulo: 'El proyectorista', capa: 'trayectorias-de-vida',
          texto: '<p>Entrevista al hijo de uno de los proyectoristas, que conserva bitácoras de cada función.</p>',
          fecha: { inicio: '1970', fin: null }, mapa: null, imagen: null,
          embed: e('https://www.youtube.com/watch?v=_KS2o-W1KqI'), relaciones: [501], autores: [A.ana] },
      ],
    },
  ];

  const recursosGenerales = [
    { id: 401, titulo: 'Sube tu audio', descripcion: 'Formulario para que la comunidad envíe la historia de su medio.', url: 'https://example.org/sube-tu-audio', portafolio: null },
    { id: 402, titulo: 'Guía de entrevista para estudiantes', descripcion: 'Material del taller de mapeo.', url: 'https://example.org/guia', portafolio: null },
    { id: 403, titulo: 'Cómo enlazar audio y video', descripcion: 'Paso a paso para subir a YouTube o Spotify y pegar el enlace.', url: 'https://example.org/embeds', portafolio: null },
  ];

  window.TA_DATOS = { COMUNAS, portafolios, recursosGenerales };
})();
