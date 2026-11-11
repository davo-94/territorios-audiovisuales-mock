# Contrato de datos v2

Forma única de los datos de Territorios Audiovisuales. La consumen **el mock** (desde `data/*.json`) y **el plugin** de WordPress (desde la API REST). Si un visor funciona con el JSON de ejemplo, funciona con el plugin: portar es cambiar la URL del `fetch`.

> "v2" es la versión de este documento. El namespace REST sigue siendo `territorios/v1`, porque la API aún no es pública.

## Principios

1. **Un corpus, varias lentes.** El relato se carga una vez; mapa, línea de tiempo e imagen son proyecciones del mismo dato.
2. **Las anclas son opcionales.** Cada grupo elige qué formatos usa. Un ancla que no existe es `null`, nunca `0` ni `""`.
3. **Sin archivos pesados.** Audio y video son siempre embebidos. La única subida es la imagen base del visor interactivo.
4. **Escalar es crear contenido, no código.** Un territorio nuevo es un portafolio nuevo; nada más cambia.

## Entidades

### Portafolio

Un territorio o trabajo de un grupo. Contiene relatos, recursos y créditos.

```json
{
  "id": 42,
  "slug": "ejemplo",
  "titulo": "Portafolio de ejemplo",
  "anio": "2026",
  "resumen": "Texto breve para tarjetas del índice y cabecera.",
  "presentacion": "<p>Contexto del territorio…</p>",
  "informe": "<p>Texto completo del informe del grupo…</p>",
  "secciones": ["territorio", "mapa", "linea", "multimedia", "texto"],
  "vista_mapa": null,
  "imagen_base": null,
  "portada": { "url": "https://…/portada.webp", "alt": "…" },
  "autores": [{ "slug": "nombre-apellido", "nombre": "Nombre Apellido" }],
  "creditos": "Curso, docentes y agradecimientos.",
  "recursos": [],
  "relatos": []
}
```

| Campo | Tipo | Regla |
|---|---|---|
| `anio` | string `YYYY` | Año o cohorte del trabajo. Permite filtrar por generación. |
| `resumen` | string (texto plano) | Máx. ~300 caracteres. |
| `presentacion` | string HTML \| `null` | Contenido de la pestaña **Territorio**. |
| `informe` | string HTML \| `null` | Contenido de la pestaña **Texto**. |
| `secciones` | string[] | Ver [Pestañas](#pestañas-del-portafolio). |
| `vista_mapa` | `{lat, lng, zoom}` \| `null` | `null` = encuadre automático sobre los puntos del portafolio. |
| `imagen_base` | `{url, ancho, alto, alt}` \| `null` | Requerida para la pestaña **Imagen**. |
| `portada` | `{url, alt}` \| `null` | Imagen de la tarjeta en el índice. |

### Relato

La unidad mínima: texto + multimedia + anclas.

```json
{
  "id": 101,
  "portafolio": 42,
  "titulo": "Título del relato",
  "texto": "<p>…</p>",
  "extracto": "Primeras líneas en texto plano…",
  "capa": "iniciativas",
  "fecha": { "inicio": "1973", "fin": "1990" },
  "mapa": { "lat": -33.4810, "lng": -70.6620 },
  "imagen": null,
  "embed": {
    "tipo": "youtube",
    "url": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
    "src": "https://www.youtube-nocookie.com/embed/XXXXXXXXXXX"
  },
  "relaciones": [7, 210],
  "autores": [{ "slug": "nombre-apellido", "nombre": "Nombre Apellido" }]
}
```

| Campo | Tipo | Regla |
|---|---|---|
| `portafolio` | int | ID del portafolio dueño. Un relato pertenece a un solo portafolio. |
| `capa` | enum | `iniciativas` · `trayectorias-de-vida` · `recuerdos`. |
| `fecha` | `{inicio, fin}` \| `null` | ISO parcial: `YYYY`, `YYYY-MM` o `YYYY-MM-DD`. `fin: null` = momento; con `fin` = período (`fin ≥ inicio`). Se ordena como texto. |
| `mapa` | `{lat, lng}` \| `null` | WGS84, 6 decimales máx. Dentro de la RM. |
| `imagen` | `{x, y}` \| `null` | Posición relativa `0..1` sobre `imagen_base` del portafolio. |
| `embed` | objeto \| `null` | Ver [Multimedia embebida](#multimedia-embebida). |
| `relaciones` | int[] | IDs de otros relatos publicados. **Pueden cruzar portafolios** (trenzado). Se devuelven solo IDs que existen y están publicados. |

La **comuna** no se guarda: el visor la calcula desde `mapa` cruzándola con el GeoJSON de comunas. Así no hay un dato que el estudiante deba llenar ni que pueda quedar inconsistente.

### Recurso

Material de apoyo: documentos, enlaces, archivos externos (Drive, YouTube, etc.).

```json
{
  "id": 300,
  "titulo": "Informe completo (PDF)",
  "descripcion": "Versión original entregada por el grupo.",
  "url": "https://drive.google.com/…",
  "portafolio": 42
}
```

`portafolio: null` = recurso general. La página **Recursos** lista todos (con buscador); la barra lateral del portafolio muestra solo los suyos.

### Autor

`{ "slug": "nombre-apellido", "nombre": "Nombre Apellido" }`. Una persona acreditada, tenga o no cuenta en el sitio.

## Pestañas del portafolio

Catálogo fijo de **6 tipos**. Cada portafolio activa **máximo 5**, en el orden que elija.

| Clave | Pestaña | Contenido | Se muestra si… |
|---|---|---|---|
| `territorio` | Territorio | `presentacion` | `presentacion` no está vacía |
| `mapa` | Mapa | Relatos con `mapa` | ≥ 1 relato con `mapa` |
| `linea` | Línea de tiempo | Relatos con `fecha` | ≥ 1 relato con `fecha` |
| `imagen` | Imagen | `imagen_base` + relatos con `imagen` | hay `imagen_base` y ≥ 1 relato con `imagen` |
| `multimedia` | Multimedia | Galería con los `embed` de los relatos | ≥ 1 relato con `embed` |
| `texto` | Texto | `informe` | `informe` no está vacío |

Reglas:
- `secciones` admite solo esas claves, sin repetidos, máximo 5.
- **El servidor filtra**: la API devuelve solo las pestañas activas que tienen contenido. Mock y plugin se comportan igual.
- Créditos y recursos **no son pestañas**: están siempre presentes.

## Multimedia embebida

El estudiante pega el **enlace** de la plataforma. El servidor reconoce el proveedor y arma `src`. **Nunca** se acepta ni se devuelve un `<iframe>` escrito por un usuario.

| `tipo` | Enlaces aceptados | `src` generado |
|---|---|---|
| `youtube` | `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/` | `https://www.youtube-nocookie.com/embed/{id}` |
| `vimeo` | `vimeo.com/{id}` | `https://player.vimeo.com/video/{id}` |
| `spotify` | `open.spotify.com/{episode\|track\|show\|playlist}/{id}` | `https://open.spotify.com/embed/{tipo}/{id}` |
| `soundcloud` | `soundcloud.com/…` | `https://w.soundcloud.com/player/?url={url codificada}` |

Un enlace de otro proveedor se rechaza al guardar (o se carga como **Recurso**).

## Endpoints (solo lectura, públicos)

| Ruta | Uso | Devuelve |
|---|---|---|
| `GET /wp-json/territorios/v1/portafolios` | Página Territorios (índice) | Lista liviana: `id, slug, titulo, anio, resumen, portada, centro, conteo` |
| `GET /wp-json/territorios/v1/portafolios/{slug}` | Página de un portafolio | Portafolio completo con `relatos` y `recursos` |
| `GET /wp-json/territorios/v1/relatos` | Trenza general y choropleth del índice | Relatos en versión resumida (sin `texto`, con `extracto`) + `portafolio: {id, slug, titulo}` |

Extras del índice:
- `centro`: `{lat, lng}` promedio de los relatos con `mapa`, o `null`.
- `conteo`: `{ "iniciativas": n, "trayectorias-de-vida": n, "recuerdos": n }`.

Filtros de `/relatos`: `?portafolio=<slug>`, `?capa=<slug>`, `?autor=<slug>`, `?anio=YYYY`.

Solo se exponen contenidos **publicados**. Borradores y pendientes viven en la API autenticada del editor (contrato de escritura, pendiente).

## Correspondencia con WordPress

| Contrato | Almacenamiento |
|---|---|
| Portafolio | CPT `portafolio` (estados nativos: borrador → pendiente → publicado) |
| `resumen` | `post_excerpt` |
| `informe` | `post_content` (lo indexa el buscador nativo) |
| `presentacion`, `secciones`, `vista_mapa`, `anio`, `creditos` | meta `ta_presentacion`, `ta_secciones`, `ta_vista_mapa`, `ta_anio`, `ta_creditos` |
| `imagen_base`, `portada` | adjunto (ID en meta `ta_imagen_base`) / imagen destacada |
| Relato | CPT `relato`; `portafolio` = `post_parent` |
| `capa` | taxonomía `ta_capa` |
| `fecha` | meta `ta_fecha` (inicio) + `ta_fecha_fin` |
| `mapa`, `imagen` | meta `ta_lat`, `ta_lng`, `ta_img_x`, `ta_img_y` |
| `embed` | meta `ta_embed_url` (`tipo` y `src` se derivan al leer) |
| `relaciones` | meta `ta_relaciones` (int[]) |
| `autores` | taxonomía `ta_autor` (en relato y portafolio) |
| Recurso | CPT `recurso`; `portafolio` = `post_parent` |

Sin tablas propias. `ta_territorio` queda reemplazada por el CPT `portafolio`.
