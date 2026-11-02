# LINCEO DETECTOR

Extensión de Chrome (Manifest V3) que muestra el stack de cualquier sitio y audita lo que importa al visitante: **seguridad y privacidad**, SEO, rendimiento, accesibilidad, DNS/correo e historial de cambios.

## Probarla localmente
1. `chrome://extensions` → activar **Modo desarrollador**.
2. **Cargar descomprimida** → elegir esta carpeta (`linceo-detector/`).
3. Abrir un sitio y pulsar el icono de LINCEO DETECTOR.

## Publicar en Chrome Web Store
1. `./scripts/package.sh` genera `../linceo-detector-1.0.0.zip`.
2. Entrar al [Panel de desarrolladores](https://chrome.google.com/webstore/devconsole) (pago único de registro de US$5; verificar en el panel).
3. **Nuevo elemento** → subir el ZIP → completar ficha (ver `STORE-LISTING.md`).
4. Pestaña **Privacidad**: justificar permisos, declarar que no se recopilan datos y enlazar la política (`PRIVACY.md` publicado en una URL pública, p. ej. GitHub Pages).
5. Enviar a revisión.

## Permisos y por qué
- `activeTab` + `scripting`: leer la pestaña activa solo al pulsar el icono.
- `storage`: guardar el historial local de análisis.
- Opcionales (se piden solo al pulsar «Analizar cookies», y solo para el sitio analizado): `cookies` y acceso al sitio.
- Sin permisos de host al instalar: no puede leer sitios en segundo plano.

## Qué hace cada pestaña
Resumen · Seguridad · Stack · Auditoría · Página · Rendimiento · DNS · Cambios · Comparar. Exporta Informe PDF, JSON y Markdown.

Las detecciones son heurísticas; verificar antes de actuar.
