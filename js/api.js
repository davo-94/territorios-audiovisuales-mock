/* ============================================================
   API simulada: mismas rutas y respuestas que el REST del plugin
   (territorios/v1). Al portar, cada función pasa a ser un fetch:
     API.portafolios()      -> GET /portafolios
     API.portafolio(slug)   -> GET /portafolios/{slug}
     API.relatos(filtros)   -> GET /relatos?portafolio=&capa=&autor=&anio=
   ============================================================ */
(function () {
  'use strict';
  const D = window.TA_DATOS;

  const todos = () => D.portafolios.flatMap(pf => pf.relatos);
  const idsPublicados = () => new Set(todos().map(r => r.id));
  const extracto = html => {
    const t = String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return t.length > 160 ? t.slice(0, 157).trimEnd() + '…' : t;
  };
  const resumenPf = pf => ({ id: pf.id, slug: pf.slug, titulo: pf.titulo });

  /** Arma la respuesta de un portafolio tal como la entrega el servidor. */
  function serializarPortafolio(pf, validos) {
    const ids = validos || idsPublicados();
    const relatos = pf.relatos.map(r => Object.assign({}, r, {
      extracto: extracto(r.texto),
      relaciones: (r.relaciones || []).filter(id => ids.has(id) && id !== r.id),
    }));
    const out = Object.assign({}, pf, { relatos });
    out.secciones = TA.seccionesVisibles(out);
    return out;
  }

  const API = {
    async portafolios() {
      return D.portafolios.map(pf => ({
        id: pf.id, slug: pf.slug, titulo: pf.titulo, anio: pf.anio, resumen: pf.resumen,
        portada: pf.portada, autores: pf.autores,
        centro: TA.centro(pf.relatos), conteo: TA.conteoPorCapa(pf.relatos),
      }));
    },

    async portafolio(slug) {
      const pf = D.portafolios.find(p => p.slug === slug);
      return pf ? serializarPortafolio(pf) : null;
    },

    async relatos(filtros) {
      const f = filtros || {};
      const ids = idsPublicados();
      return D.portafolios
        .filter(pf => !f.portafolio || pf.slug === f.portafolio)
        .filter(pf => !f.anio || pf.anio === f.anio)
        .flatMap(pf => pf.relatos.map(r => ({
          id: r.id, titulo: r.titulo, extracto: extracto(r.texto), capa: r.capa,
          fecha: r.fecha, mapa: r.mapa, embed: r.embed, autores: r.autores,
          relaciones: (r.relaciones || []).filter(id => ids.has(id) && id !== r.id),
          portafolio: resumenPf(pf),
        })))
        .filter(r => !f.capa || r.capa === f.capa)
        .filter(r => !f.autor || r.autores.some(a => a.slug === f.autor));
    },

    /** Relato completo por ID (para saltar entre portafolios desde una relación). */
    async relato(id) {
      for (const pf of D.portafolios) {
        const r = pf.relatos.find(x => x.id === id);
        if (r) return Object.assign({}, r, { extracto: extracto(r.texto), portafolio: resumenPf(pf) });
      }
      return null;
    },

    async recursos() {
      const dePf = D.portafolios.flatMap(pf => pf.recursos.map(r => Object.assign({}, r, { portafolio: resumenPf(pf) })));
      return dePf.concat(D.recursosGenerales);
    },

    /** Solo mock: vista previa de un borrador del playground con las mismas reglas del servidor. */
    vistaPrevia(pf) {
      const ids = new Set(pf.relatos.map(r => r.id).concat([...idsPublicados()]));
      return serializarPortafolio(pf, ids);
    },
  };

  window.API = API;
})();
