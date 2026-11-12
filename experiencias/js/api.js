/* ============================================================
   API simulada: mismas rutas y respuestas que el REST del plugin
   (territorios/v1). Al portar, cada función pasa a ser un fetch:
     API.portafolios()      -> GET /portafolios
     API.portafolio(slug)   -> GET /portafolios/{slug}
     API.relatos(filtros)   -> GET /relatos?portafolio=&capa=&autor=&anio=
   Un portafolio (territorio) contiene experiencias; ambos son "fichas"
   con la misma forma (vistas, relatos, caracterización…).
   ============================================================ */
(function () {
  'use strict';
  const D = window.TA_DATOS;

  const ref = pf => ({ id: pf.id, slug: pf.slug, titulo: pf.titulo });
  const fichasDe = pf => [{ ficha: pf, experiencia: null }].concat((pf.experiencias || []).map(x => ({ ficha: x, experiencia: x })));

  /** Todos los relatos publicados, con referencia a su portafolio y experiencia. */
  function todos() {
    return D.portafolios.flatMap(pf => fichasDe(pf).flatMap(({ ficha, experiencia }) =>
      ficha.relatos.map(r => ({ r, pf, experiencia }))));
  }
  const extracto = html => {
    const t = String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return t.length > 160 ? t.slice(0, 157).trimEnd() + '…' : t;
  };
  const tieneContenido = pf => TA.vistasVisibles(pf).length > 0 || (pf.experiencias || []).some(x => TA.vistasVisibles(x).length);

  function serializarFicha(f, ids) {
    const relatos = f.relatos.map(r => Object.assign({}, r, {
      extracto: extracto(r.texto),
      relaciones: (r.relaciones || []).filter(id => ids.has(id) && id !== r.id),
    }));
    const out = Object.assign({}, f, { relatos });
    out.vistas = TA.vistasVisibles(out);
    return out;
  }
  function serializarPortafolio(pf, ids) {
    const out = serializarFicha(pf, ids);
    out.experiencias = (pf.experiencias || []).map(x => serializarFicha(x, ids));
    return out;
  }

  const API = {
    async portafolios() {
      return D.portafolios.map(pf => {
        const rel = fichasDe(pf).flatMap(x => x.ficha.relatos);
        return {
          id: pf.id, slug: pf.slug, titulo: pf.titulo, anio: pf.anio, resumen: pf.resumen,
          portada: pf.portada, autores: pf.autores, en_preparacion: !tieneContenido(pf),
          experiencias: (pf.experiencias || []).map(x => ({ slug: x.slug, titulo: x.titulo })),
          centro: TA.centro(rel), conteo: TA.conteoPorCapa(rel),
        };
      });
    },

    async portafolio(slug) {
      const pf = D.portafolios.find(p => p.slug === slug);
      return pf ? serializarPortafolio(pf, new Set(todos().map(x => x.r.id))) : null;
    },

    async relatos(filtros) {
      const f = filtros || {};
      const ids = new Set(todos().map(x => x.r.id));
      return todos()
        .filter(({ pf }) => (!f.portafolio || pf.slug === f.portafolio) && (!f.anio || pf.anio === f.anio))
        .map(({ r, pf, experiencia }) => ({
          id: r.id, titulo: r.titulo, extracto: extracto(r.texto), capa: r.capa,
          fecha: r.fecha, mapa: r.mapa, embed: r.embed, autores: r.autores || [],
          relaciones: (r.relaciones || []).filter(id => ids.has(id) && id !== r.id),
          portafolio: ref(pf), experiencia: experiencia ? { slug: experiencia.slug, titulo: experiencia.titulo } : null,
        }))
        .filter(r => !f.capa || r.capa === f.capa)
        .filter(r => !f.autor || r.autores.some(a => a.slug === f.autor));
    },

    /** Relato completo por ID (para saltar entre fichas o portafolios desde una relación). */
    async relato(id) {
      const x = todos().find(t => t.r.id === id);
      if (!x) return null;
      return Object.assign({}, x.r, {
        extracto: extracto(x.r.texto), portafolio: ref(x.pf),
        experiencia: x.experiencia ? { slug: x.experiencia.slug, titulo: x.experiencia.titulo } : null,
      });
    },

    async recursos() {
      const dePf = D.portafolios.flatMap(pf => (pf.recursos || []).map(r => Object.assign({}, r, { portafolio: ref(pf) })));
      return dePf.concat(D.recursosGenerales);
    },

    /** Solo mock: vista previa de un borrador del playground con las mismas reglas del servidor. */
    vistaPrevia(pf) {
      const ids = new Set(fichasDe(pf).flatMap(x => x.ficha.relatos.map(r => r.id)).concat(todos().map(x => x.r.id)));
      return serializarPortafolio(pf, ids);
    },
  };

  window.API = API;
})();
