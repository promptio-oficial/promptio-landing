# LINCEO DETECTOR: análisis de mercado, FODA y hoja de ruta

Fecha del análisis: 2-nov-2026. Las cifras de terceros provienen de búsquedas web y de la API de GitHub; donde la fuente es débil o contradictoria se marca **Verificar**.

## 1. Qué es hoy LINCEO DETECTOR (v1.1.0)

Extensión MV3 que, al pulsar el icono, analiza la pestaña activa **sin servidores propios** y entrega:

| Capa | Contenido |
|---|---|
| Visitante (Seguridad) | Nivel de exposición, quién recibe datos (≈60 dominios de rastreo clasificados), grabación de sesión, huellas digitales, formularios y destino de los datos, permisos concedidos, señales de phishing, acciones inmediatas |
| Stack | 213 firmas: frameworks, CMS, tema y plugins de WordPress con versión, servidor, CDN, e-commerce, pagos Latam |
| Auditoría | 5 puntajes (seguridad, SEO, rendimiento, accesibilidad, privacidad), nota de cabeceras, análisis de CSP/HSTS/Referrer/CORS, robots.txt, sitemap, security.txt, obsolescencia |
| Datos | Metadatos de la página, estructura, TTFB/FCP/LCP/CLS, terceros, beacons |
| DNS y correo | A/AAAA/NS/MX/TXT/CAA, SPF, DMARC, MTA-STS, DNSSEC, edad del dominio (RDAP) |
| Memoria | Historial local por sitio, diferencias entre escaneos, tendencia, comparación de dos sitios |
| Salidas | Informe PDF, JSON, Markdown, cookies a fondo (permiso opcional) |

## 2. Mercado: productos comparables, uno por uno

### 2.1 Wappalyzer
- **Qué es:** el perfilador de tecnologías de referencia. Extensión para Chrome, Firefox, Edge y Safari, más API y datos de leads. Fuentes agregadoras citan más de 4.500 tecnologías.
- **Precio:** extensión gratuita con 50 consultas; planes Pro y Business de pago (reseñas citan US$250 y US$450 mensuales; otras fuentes discrepan). **Verificar** en wappalyzer.com.
- **Fortalezas:** cobertura enorme, marca, monitoreo y exportación.
- **Debilidades:** muy centrado en leads B2B; no audita seguridad ni privacidad del visitante; límites de uso en el plan gratis.
- **Dato clave de GitHub:** el proyecto original pasó a ser privado en agosto de 2023; sus huellas sobreviven en forks con licencia **GPL-3.0**, p. ej. `enthec/webappanalyzer` (★607, activo al 1-nov-2026) y `HTTPArchive/wappalyzer` (★145). Implicación legal en §6.

### 2.2 BuiltWith Technology Profiler
- **Qué es:** extensión gratuita (listados hablan de unos 300.000 usuarios, **Verificar**) que lee HTML, cabeceras y JavaScript y muestra tecnologías.
- **Pago:** historial, generación de leads y API están en el servicio de pago.
- **Fortalezas:** historial de adopción de tecnologías a escala de internet.
- **Debilidades:** sin auditoría, sin privacidad del visitante; lo valioso está tras el pago.

### 2.3 WhatRuns
- **Qué es:** extensión gratuita; frameworks, analítica, plugins de WordPress y tipografías. Un espejo de la tienda lista más de 300.000 usuarios y versión 1.10.0 (abr-2026). **Verificar.**
- **Fortalezas:** simple, sin registro, muestra plugins de WordPress.
- **Debilidades:** sin puntajes, sin seguridad, sin DNS, sin historial local propio. Las alertas de cambios que citan algunos directorios no están confirmadas.

### 2.4 Ghostery
- **Qué es:** bloqueador de rastreadores con base de datos curada y panel de análisis. La comparación del propio vendor destaca "análisis de rastreadores" frente a Privacy Badger.
- **Pago:** algunas analíticas e historial son de suscripción (según una reseña).
- **Fortalezas:** bloquea y explica; base `ghostery/trackerdb` (★202, licencia sin declarar: **Verificar**).
- **Debilidades:** su foco es bloquear, no auditar el sitio ni su stack.

### 2.5 Privacy Badger (EFF)
- **Qué es:** bloqueador que **aprende** heurísticamente de qué dominios te siguen entre sitios, sin listas fijas. `EFForg/privacybadger` ★3.885; `EFForg/badger-sett` (MIT) entrena automáticamente.
- **Fortalezas:** sin listas manuales, respaldo de una ONG.
- **Debilidades:** no explica qué datos toma cada servicio ni audita el sitio.

### 2.6 DuckDuckGo Privacy Essentials
- **Qué es:** nota A–F por sitio según HTTPS, cantidad de redes de rastreo y prácticas de privacidad; bloquea por defecto.
- **Fortalezas:** el modelo mental más simple para el usuario común (una letra).
- **Debilidades:** no muestra stack ni seguridad técnica; no detecta formularios peligrosos ni grabación de sesión de forma explícita (**Verificar**).
- **Dato:** `duckduckgo/tracker-radar` (★1.742, activo) es un conjunto de datos de los dominios de terceros principales con metadatos. Su licencia figura como "NOASSERTION" en GitHub: **Verificar** antes de usarlo (recuerdo condiciones no comerciales).

### 2.7 Blacklight (The Markup)
- **Qué es:** herramienta **web** (no extensión) que visita una URL y detecta cookies de terceros, píxeles de Google/Meta/TikTok/X, huellas por canvas, captura de teclado y grabación de sesión.
- **Fortaleza:** es la referencia en profundidad de privacidad, con metodología publicada. `the-markup/blacklight-collector` (★243, GPL-3.0).
- **Debilidades:** hay que ir a su sitio; no ve el servidor; sin stack ni auditoría técnica.
- **Es el competidor conceptual más cercano a nuestra pestaña Seguridad.** Se diferencia en que LINCEO corre dentro de tu sesión real, ve tus permisos, tu almacenamiento y tus formularios.

### 2.8 MDN HTTP Observatory
- **Qué es:** nota de cabeceras de seguridad; base 100 con penalizaciones y bonos, máximo 145, nota por letra. `mdn/mdn-http-observatory` (MPL-2.0, ★147); el repositorio histórico de Mozilla está archivado.
- **Fortaleza:** criterios públicos y respetados.
- **Debilidad:** solo cabeceras y se usa desde un sitio web.
- **Uso en LINCEO:** nuestra nota A–F es más simple (seis cabeceras). Conviene alinear el cálculo a su rúbrica (§5, ítem R3).

### 2.9 Lighthouse (Google)
- **Qué es:** auditor de código abierto (Apache-2.0, ★30.996) integrado en DevTools: rendimiento, accesibilidad (reglas de axe-core), buenas prácticas y SEO, puntaje 0–100 por categoría.
- **Fortalezas:** estándar de facto, métricas de laboratorio completas.
- **Debilidades:** no detecta stack ni privacidad del visitante; requiere abrir DevTools.
- **Diferencia:** LINCEO no reemplaza a Lighthouse en rendimiento. Mide las métricas reales de esa carga (LCP, CLS, TTFB) y las pone junto a seguridad y privacidad.

### 2.10 Netcraft Extension
- **Qué es:** extensión antiphishing con reporte del sitio, calificación de riesgo, antigüedad, popularidad y ubicación del hosting; bloquea sitios fraudulentos conocidos y peticiones salientes con datos sensibles a dominios sospechosos. Fuente principal: listado de Opera de 2023. **Verificar** versión actual.
- **Fortalezas:** inteligencia de amenazas colectiva (reportes de la comunidad).
- **Debilidades:** no es perfilador de stack ni de privacidad de terceros.
- **Es la referencia para nuestras señales de phishing**, que son solo heurísticas locales. Netcraft tiene una base de reputación que nosotros no.

### 2.11 SEOquake / Detailed SEO
- **Qué es:** análisis SEO en la página y superposición en resultados de búsqueda. Más datos con cuenta Semrush. Las fuentes encontradas son de baja calidad: **Verificar** funciones actuales.
- **Debilidades frente a LINCEO:** sin seguridad ni privacidad. **Fortaleza:** métricas de autoridad y backlinks, que una extensión sin servidor no puede igualar.

### 2.12 uBlock Origin y bloqueadores
- `gorhill/uBlock` (★69.019, GPL-3.0) y las listas EasyList/EasyPrivacy (`easylist/easylist`, ★3.195) son la base real del bloqueo.
- No son perfiladores; **son la acción que recomendamos** en "Qué hacer ahora".

### 2.13 Editores de cookies
- Una publicación de un vendor afirma que EditThisCookie dejó de funcionar al pasar a Manifest V3 (**Verificar**, texto promocional).
- La documentación oficial confirma que leer cookies HttpOnly y atributos exige el permiso `cookies` más permisos de host. LINCEO lo resolvió como permiso **opcional por sitio**.

### 2.14 SICScope (referencia entregada por ti)
- **Qué es:** panel con analítica/etiquetas, tipografía, servidor, hosting, misceláneos, "Qué mejorar", DNS vía Cloudflare, datos de página y estructura; informe PDF con prioridades alta/media/baja, nota de headers, tabla de seguridad, tecnologías, plugins de WordPress y datos de página.
- **Fortalezas:** informe limpio y listo para entregar a un cliente; DNS integrado.
- **Debilidades:** no analiza qué te hace el sitio a ti (rastreo, grabación, formularios, permisos), sin historial ni comparación, sin puntajes por área.

### 2.15 Proyectos abiertos encontrados en GitHub
| Repositorio | ★ | Licencia | Relevancia |
|---|---|---|---|
| `projectdiscovery/wappalyzergo` | 1.130 | MIT | Detección por huellas en Go; usable como motor de pruebas, no en la extensión |
| `enthec/webappanalyzer` | 607 | GPL-3.0 | Base de huellas continuada de Wappalyzer |
| `miraihack/tech_detector` | 26 | sin licencia | Extensión MV3 de detección; competidor directo pequeño (**Verificar** funciones) |
| `rahulwebvoltz/chrome-extention-techstack-detector` | 0 | sin licencia | Afirma 7.500 tecnologías (**Verificar**) |
| `mihneamanolache/antibot-detector` | 54 | MIT | Detección de antibots y huellas digitales: referencia para mejorar nuestras heurísticas |
| `muhammadbalalansar/http-header-scanner` | 1 | AGPL-3.0 | Nota de cabeceras estilo Observatory |
| `duckduckgo/tracker-radar` y `tracker-radar-collector` | 1.742 / 170 | sin declarar | Datos y rastreador de terceros: **Verificar** licencia |
| `ghostery/trackerdb` | 202 | sin declarar | Base de rastreadores: **Verificar** licencia |
| `EFForg/badger-sett` | 145 | MIT | Entrenamiento automatizado de Privacy Badger |
| `the-markup/blacklight-collector` | 243 | GPL-3.0 | Metodología de privacidad |

Conclusión del mercado: **hay perfiladores de stack, bloqueadores, auditores de cabeceras y auditores de rendimiento por separado. No encontré un producto que junte los cuatro con la mirada del visitante, historial y comparación en una sola extensión sin servidor.** Es una conclusión de mi búsqueda acotada: **Verificar** con una revisión manual de la Chrome Web Store antes de afirmarlo públicamente.

## 3. Matriz comparativa

Leyenda: ● sí · ◐ parcial · ○ no · ? sin verificar.

| Capacidad | LINCEO | Wappalyzer | BuiltWith | WhatRuns | Ghostery | Priv. Badger | DDG | Blacklight | Observatory | Lighthouse | Netcraft | SICScope |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Stack con versiones | ● | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ◐ | ● |
| Plugins/tema WordPress | ● | ◐ | ? | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| Rastreadores por empresa y qué toman | ● | ○ | ○ | ○ | ● | ◐ | ● | ● | ○ | ○ | ○ | ◐ |
| Grabación de sesión / huellas | ◐ | ○ | ○ | ○ | ◐ | ◐ | ◐ | ● | ○ | ○ | ○ | ○ |
| Formularios y destino de datos | ● | ○ | ○ | ○ | ○ | ○ | ○ | ◐ | ○ | ○ | ◐ | ○ |
| Permisos y almacenamiento del visitante | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Señales de phishing | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ○ |
| Cabeceras en profundidad | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ◐ | ○ | ◐ |
| Cookies con HttpOnly/SameSite | ● (opcional) | ○ | ○ | ○ | ◐ | ◐ | ○ | ● | ○ | ○ | ○ | ○ |
| SEO / accesibilidad / rendimiento | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ○ | ◐ |
| DNS, correo y edad del dominio | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ◐ | ◐ |
| Historial, cambios y comparación | ● | ◐ (pago) | ◐ (pago) | ? | ◐ (pago) | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Informe PDF / JSON / MD | ● | ◐ | ◐ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ○ | ◐ |
| Funciona sin servidor propio | ● | ◐ | ◐ | ◐ | ● | ● | ● | ○ | ○ | ● | ○ | ? |
| Bloquea rastreadores | ○ | ○ | ○ | ○ | ● | ● | ● | ○ | ○ | ○ | ◐ | ○ |

Las celdas de competidores se basan en descripciones públicas y no en pruebas propias. Las marcadas con "?" o contradictorias quedan por verificar.

## 4. FODA de LINCEO DETECTOR

### Fortalezas
1. **Mirada del visitante:** quién te rastrea, qué toma y qué hacer; ninguna de las extensiones de stack lo hace.
2. **Cuatro capas en una:** stack, seguridad, privacidad y calidad del sitio, más DNS y correo.
3. **Memoria:** historial local, cambios y comparación entre sitios.
4. **Privacidad por diseño:** sin servidores propios, permisos mínimos (`activeTab`, `scripting`, `storage`), cookies como permiso opcional.
5. **Entregables:** PDF, JSON y Markdown; recomendaciones con "cómo corregirlo".
6. **Contexto local:** firmas de pagos y e-commerce de Latam (Webpay, Khipu, Flow, Fintoc, Tiendanube) y recordatorio sobre la ley chilena de datos.

### Oportunidades
1. Que Wappalyzer cerró su base de código y limitó el plan gratuito deja un hueco para una alternativa gratuita y con más profundidad.
2. Creciente interés regulatorio por la privacidad (Chile: Ley 21.719, **Verificar** fecha de vigencia).
3. Mercado hispanohablante con pocas herramientas en español.
4. Agencias y consultores necesitan un informe de entrega (diferenciación frente a Wappalyzer).
5. Integrar datasets abiertos de rastreadores (Tracker Radar, TrackerDB) si su licencia lo permite.
6. Nicho de "antes de comprar o registrarme": edad del dominio, phishing, formularios.

### Debilidades
1. **Cobertura de firmas:** 213 frente a miles en los líderes.
2. **Heurísticas:** huellas, keyloggers y ofuscación son indicios, no pruebas; riesgo de falsos positivos.
3. **Visibilidad limitada de red:** sin permisos de host no vemos cookies de terceros, cabeceras originales ni peticiones futuras.
4. **Sin base de reputación de dominios** (Netcraft sí la tiene).
5. **Solo español**, sin pruebas automatizadas ni CI, sin marca ni reseñas.
6. **Nota de seguridad severa:** cada hallazgo alto resta mucho; un sitio con varios llega a 0.
7. **Una sola pasada:** no ve lo que ocurre tras interacciones del usuario (login, scroll, consentimiento).

### Amenazas
1. **Políticas de Chrome Web Store:** propósito único, justificación de permisos opcionales amplios (`*://*/*`) y revisión más lenta.
2. **Competidores grandes** pueden añadir funciones de privacidad (DuckDuckGo, Ghostery).
3. **Falsos positivos** que generen quejas de sitios legítimos o daño reputacional.
4. **Licencias:** reutilizar huellas GPL o datos no comerciales puede obligar a abrir el código o impedir el uso comercial.
5. **Cambios en Chrome** (MV3, APIs de cookies y de rendimiento).
6. **Heurísticas de phishing** pueden dar falsa seguridad si el usuario confía ciegamente.

## 5. Observaciones del FODA → mejoras

| # | Observación | Estado | Qué se hizo / qué falta |
|---|---|---|---|
| D3 | Cookies de terceros y HttpOnly invisibles | **Hecho** | Cookies a fondo con permiso opcional por sitio; reglas HttpOnly/Secure/SameSite/duración |
| D6 | Sin profundidad de cabeceras | **Hecho** | Analiza CSP (unsafe-inline, comodines, base-uri), HSTS (max-age, subdominios), Referrer, CORS, cache |
| D2 | Pocos indicios de comportamiento | **Parcial** | Métricas de beacons, CLS, iframes ocultos y SRI; sigue siendo heurístico |
| D4 | Sin reputación de dominio | **Parcial** | Edad y registrador vía RDAP, DNSSEC, MTA-STS; falta lista de dominios maliciosos |
| D1 | Cobertura de firmas | **Parcial** | De 156 a 213; falta mecanismo de actualización (R1) |
| D6b | Nota de seguridad severa | Pendiente | Escala con tope por área (R2) |
| O3 | Informe y comparación | **Hecho** | Pestaña Comparar, tendencia, Resumen con veredicto |
| UX | Interfaz | **Hecho** | Veredicto en color, íconos, pestañas, tarjetas, modo oscuro, corregido el clic sobre pestañas con ícono |
| Pasivo | No sondear rutas ajenas | **Decisión** | robots.txt, sitemap.xml y security.txt sí (públicos y estándar); **no** se prueban `.git`, `.env` ni paneles |

### Hoja de ruta propuesta
- **R1. Firmas actualizables:** empaquetar las huellas como JSON versionado y publicarlas en cada versión; decidir licencia (§6).
- **R2. Puntajes calibrados:** alinear la nota de cabeceras a la rúbrica de MDN Observatory y suavizar la escala (caída logarítmica).
- **R3. Reputación de dominios:** integrar una lista de phishing abierta si su licencia lo permite, consultada de forma local y sin enviar la URL completa.
- **R4. Observación de red real (permiso opcional):** `webRequest` para ver cabeceras originales, redirecciones y peticiones de terceros en vivo durante 10 segundos tras cargar. Es lo que acerca la profundidad a Blacklight.
- **R5. Comparar contra un referente:** percentil frente a datos de HTTP Archive (rendimiento, tecnologías) y prevalencia de rastreadores por categoría.
- **R6. Inglés y Firefox.**
- **R7. Pruebas:** batería con páginas de ejemplo (el arnés usado en esta sesión) en CI.
- **R8. Monitoreo:** alertas locales cuando cambian versiones, cabeceras o rastreadores de un sitio guardado.

## 6. Cuestiones legales y de licencias (Verificar con asesoría)
- Las huellas derivadas de Wappalyzer están bajo **GPL-3.0**: usarlas obliga a publicar LINCEO bajo GPL-3.0. Hoy LINCEO usa **firmas propias**, así que no está afectado.
- Los conjuntos de datos de rastreadores (Tracker Radar, TrackerDB) declaran licencia ambigua en GitHub; no los integré.
- Chrome Web Store exige política de privacidad pública (`PRIVACY.md`) y justificación de cada permiso, incluido el opcional de cookies.
- Las alertas de phishing y de rastreo son **indicios**, no dictámenes: la interfaz lo declara.

## 7. Profundidad actual de investigación

| Nivel | Qué obtiene | Estado |
|---|---|---|
| N1 | DOM, metadatos, scripts y cabeceras de una re-petición | Hecho |
| N2 | Observadores de rendimiento (LCP, CLS, recursos, beacons), análisis de scripts propios | Hecho |
| N3 | Archivos públicos (robots, sitemap, security.txt), DNS, DNSSEC, RDAP | Hecho |
| N4 | Cookies completas con atributos (permiso opcional) | Hecho |
| N5 | Observación de red en vivo, cookies de terceros, redirecciones | Pendiente (R4) |
| N6 | Rastreo multipágina, flujos de login y consentimiento | Fuera del alcance de una extensión sin servidor |
| N7 | Reputación y datos a escala de internet | Pendiente (R3, R5) |

## 8. Fuentes
- Wappalyzer: [Capterra](https://capterra.com/p/211615/Wappalyzer/), [G2](https://www.g2.com/products/wappalyzer/reviews), [SyncGTM](https://syncgtm.com/blog/wappalyzer-review-2026)
- BuiltWith: [Chrome Web Store](https://chrome.google.com/webstore/detail/builtwith-technology-prof/dapjbgnjinbpoindlpdmhochffioedbn), [blog BuiltWith](https://blog.builtwith.com/2016/04/19/extension-for-chrome-power-users)
- WhatRuns: [Chrome Web Store](https://chrome.google.com/webstore/detail/whatruns/cmkdbmfndkfgebldhnkbfhlneefdaaip), [Softpedia](https://www.softpedia.com/get/Internet/Internet-Applications-Addons/Chrome-Extensions/WhatRuns.shtml)
- Ghostery vs Privacy Badger: [Ghostery](https://www.ghostery.com/comparisons/ghostery-privacy-badger)
- DuckDuckGo: [Tom's Hardware](https://www.tomshardware.com/news/duckduckgo-extension-website-privacy-grade,36380.html), [Spread Privacy](https://spreadprivacy.com/how-does-the-duckduckgo-app-extension-protect-my-privacy/)
- Blacklight: [The Markup](https://themarkup.org/blacklight/2020/09/22/how-we-built-a-real-time-privacy-inspector)
- Observatory: [MDN](https://developer.mozilla.org/en-US/observatory/docs/tests_and_scoring)
- Lighthouse: [Chrome Developers](https://developer.chrome.com/docs/lighthouse)
- Netcraft: [blog Netcraft](https://www.netcraft.com/blog/chrome-version-of-netcraft-anti-phishing-extension-available)
- API de cookies: [Chrome Developers](https://developer.chrome.com/docs/extensions/reference/cookies/)
- Repositorios: búsqueda con la API de GitHub el 2-nov-2026 (estrellas, licencia y fecha de actividad como se indican arriba).
