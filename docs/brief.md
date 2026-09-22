# Brief y línea base técnica

Plataforma web para cartografiar territorios en 3 formatos a partir de un mismo corpus de relatos, para Radio JGM (Escuela de Periodismo / Facultad de Comunicación e Imagen, U. de Chile).

## Referencias
- Landing georreferenciada actual (formato mapa, ya existe): radiojgm.uchile.cl/territorios-audiovisuales/descubre/
- Línea de tiempo (referencia): Tiki-Toki "Territorios Audiovisuales"
- Imagen interactiva (referencia): labfractal.org/SOUNDSCAPES/chile/campus/

## Decisiones confirmadas
- Capas: **Iniciativas / Trayectorias de vida / Recuerdos** (se mantienen las 3 actuales).
- Cobertura: **toda la RM**.
- Autoría multiusuario: **periodistas, docentes y estudiantes**. ~**13–15 grupos** de alumnos crean sus cartografías; **aprueban docentes**.
- Cada grupo **elige** qué formato(s) usar (no son obligatorios los 3).
- Multimedia: **todo embebido** (Spotify/YouTube) → el sitio guarda relato + enlace, no archivos.
- Mapa: choropleth, **comuna coloreada por cantidad de relatos de la capa activa** + puntos.
- Noticias actuales **se migran**.
- Secciones: Intro/Quiénes somos, Explorar (3 lentes), Biblioteca/Recursos, Noticias, Podcast.

## Línea base técnica (sitio actual)
- **WordPress 7.0.3**, API REST activa (/wp-json/wp/v2).
- Servidor **LiteSpeed** + LiteSpeed Cache. PHP + MySQL.
- Elementor sobre tema hijo propio (`herr-child`) + plugin propio (`herr-core`).
- Arquitectura propuesta: **plugin propio** con tipo de contenido "relato" + roles nativos (Colaborador=borrador/pendiente, Editor=aprueba) + 3 visores JS que leen del REST. Mapa con Leaflet + GeoJSON comunas RM.

## Pendiente de confirmar (hosting)
- ¿Plugin propio? · ¿Subdominio o subcarpeta? · versión de PHP · quién administra.
- Secundario: límites PHP, SFTP/SSH, HTTPS, respaldos.
