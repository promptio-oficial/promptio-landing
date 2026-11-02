# Promptio Detector

Extensión de Chrome (Manifest V3) que muestra el stack de cualquier sitio y audita lo que importa al visitante: **seguridad y privacidad**, SEO, rendimiento, accesibilidad, DNS/correo e historial de cambios.

## Probarla localmente
1. `chrome://extensions` → activar **Modo desarrollador**.
2. **Cargar descomprimida** → elegir esta carpeta (`promptio-detector/`).
3. Abrir un sitio y pulsar el icono de Promptio Detector.

## Publicar en Chrome Web Store
1. `./scripts/package.sh` genera `../promptio-detector-1.0.0.zip`.
2. Entrar al [Panel de desarrolladores](https://chrome.google.com/webstore/devconsole) (pago único de registro de US$5; verificar en el panel).
3. **Nuevo elemento** → subir el ZIP → completar ficha (ver `STORE-LISTING.md`).
4. Pestaña **Privacidad**: justificar permisos, declarar que no se recopilan datos y enlazar la política (`PRIVACY.md` publicado en una URL pública, p. ej. GitHub Pages).
5. Enviar a revisión.

## Permisos y por qué
- `activeTab` + `scripting`: leer la pestaña activa solo al pulsar el icono.
- `storage`: guardar el historial local de análisis.
- Sin permisos de host: no puede leer sitios en segundo plano.

## Qué hace cada pestaña
Seguridad y privacidad · Stack · Auditoría · Página · Rendimiento · DNS y correo · Cambios. Exporta Informe PDF, JSON y Markdown.

Las detecciones son heurísticas; verificar antes de actuar.
