# Política de firmas de LINCEO DETECTOR

Decisión: **las firmas de tecnologías son propias** (`signatures.js`, `analysis.js` → tabla de rastreadores).

Reglas para agregar o corregir firmas:
1. Escribirlas a partir de observación directa del sitio o de la documentación oficial del producto (variables globales, cabeceras, rutas de recursos, atributos del DOM).
2. **No copiar ni adaptar** archivos de Wappalyzer, `enthec/webappanalyzer`, `HTTPArchive/wappalyzer` ni forks: son GPL-3.0 y obligarían a publicar LINCEO bajo esa licencia.
3. No incorporar Tracker Radar, TrackerDB ni listas similares sin confirmar antes que su licencia permite uso comercial y redistribución. Verificar.
4. Formato: sin barras invertidas (`[.]` para el punto, `[0-9]` para dígitos); un grupo de captura entrega la versión.
5. Probar cada firma nueva contra al menos un sitio real que use la tecnología, y contra uno que no, para evitar falsos positivos.

Mantener esta política permite elegir la licencia del producto libremente.
