/* Análisis puro (sin DOM): puntajes, recomendaciones, obsolescencia, nota de cabeceras, cambios y DNS. */
const Analysis = (() => {
  const PEN = { alta: 15, media: 8, baja: 3, ok: 0 };
  const AREAS = { seguridad: 'Seguridad', seo: 'SEO', rendimiento: 'Rendimiento', accesibilidad: 'Accesibilidad', privacidad: 'Privacidad' };
  const num = (v) => { const m = /^([0-9]+)\.?([0-9]*)\.?([0-9]*)/.exec(v || ''); return m ? [+m[1], +(m[2] || 0), +(m[3] || 0)] : null; };
  const lt = (v, ref) => { const a = num(v), b = num(ref); if (!a || !b) return false; for (let i = 0; i < 3; i++) { if (a[i] !== b[i]) return a[i] < b[i]; } return false; };

  function headerGrade(sec) {
    const h = sec.headers || {};
    const csp = h['content-security-policy'] || '';
    const checks = {
      'HSTS': !!h['strict-transport-security'],
      'CSP': !!csp,
      'X-Frame-Options': !!h['x-frame-options'] || /frame-ancestors/i.test(csp),
      'X-Content-Type-Options': /nosniff/i.test(h['x-content-type-options'] || ''),
      'Referrer-Policy': !!h['referrer-policy'],
      'Permissions-Policy': !!h['permissions-policy']
    };
    const n = Object.values(checks).filter(Boolean).length;
    const grade = !sec.headersOk ? '—' : n === 6 ? 'A' : n === 5 ? 'B' : n === 4 ? 'C' : n === 3 ? 'D' : n >= 1 ? 'E' : 'F';
    return { checks, grade, n };
  }


  // ── Privacidad y seguridad del visitante
  const TRK = [
    [/hotjar[.]/, 'Hotjar', 'replay', 'graba clics, scroll, movimientos del mouse y puede capturar lo que escribes'],
    [/clarity[.]ms/, 'Microsoft Clarity', 'replay', 'graba la sesión (clics, scroll, reproducción en video) y la envía a Microsoft'],
    [/fullstory|logrocket|mouseflow|smartlook|luckyorange|inspectlet|sessioncam|contentsquare|hotjar-insights/, 'Grabación de sesión', 'replay', 'reproduce tu visita como video, con riesgo de capturar datos escritos'],
    [/fingerprintjs|fpjs|fingerprint[.]com|iovation|threatmetrix|deviceatlas/, 'Huella digital del dispositivo', 'fingerprint', 'te identifica entre sitios aunque borres cookies'],
    [/doubleclick|googlesyndication|googleadservices|adservice[.]google|google-analytics[.]com\/g\/collect/, 'Google Ads / DoubleClick', 'ads', 'perfil de intereses e historial entre sitios, ID publicitario'],
    [/facebook[.](net|com)|connect[.]facebook|fbevents/, 'Meta (Facebook/Instagram)', 'ads', 'eventos de navegación vinculables a tu cuenta de Facebook/Instagram'],
    [/analytics[.]tiktok|tiktok[.]com|byteoversea/, 'TikTok Pixel', 'ads', 'eventos de navegación enviados a TikTok'],
    [/snap[.]licdn|px[.]ads[.]linkedin|linkedin[.]com/, 'LinkedIn Insight', 'ads', 'vincula tu visita a tu perfil profesional si tienes sesión'],
    [/ads-twitter|analytics[.]twitter|t[.]co$|platform[.]twitter/, 'X (Twitter)', 'ads', 'eventos de navegación enviados a X'],
    [/pinterest|pinimg/, 'Pinterest Tag', 'ads', 'eventos de navegación enviados a Pinterest'],
    [/criteo|taboola|outbrain|adnxs|rubiconproject|pubmatic|openx|amazon-adsystem|adsrvr|casalemedia|bidswitch|smartadserver|3lift|sharethrough|teads|quantserve|scorecardresearch|bat[.]bing|demdex|bluekai|krxd|rlcdn|id5-sync|liveramp/, 'Red publicitaria / data broker', 'ads', 'subasta de anuncios y perfilado entre sitios'],
    [/google-analytics|googletagmanager|analytics[.]google|stats[.]g[.]doubleclick/, 'Google Analytics / Tag Manager', 'analytics', 'páginas visitadas, dispositivo, ubicación aproximada e ID de cliente'],
    [/mixpanel|mxpnl|segment[.](com|io)|amplitude|heap(analytics)?[.]|posthog|plausible|matomo|piwik|chartbeat|hs-analytics|hs-scripts|hsforms|hubspot|klaviyo|mc[.]yandex|cloudflareinsights|newrelic|nr-data|datadoghq|sentry/, 'Analítica / marketing', 'analytics', 'comportamiento de uso, ID de usuario y eventos'],
    [/recaptcha|hcaptcha|challenges[.]cloudflare/, 'Anti-bots (CAPTCHA)', 'security', 'analiza tu comportamiento y dispositivo para distinguirte de un bot'],
    [/intercom|drift|zdassets|crisp[.]chat|tawk[.]to|livechatinc|tidio/, 'Chat de soporte', 'support', 'guarda tus mensajes y datos del dispositivo']
  ];
  const KIND = { replay: 'Graba tu sesión', fingerprint: 'Huella digital', ads: 'Publicidad / perfilado', analytics: 'Analítica', security: 'Anti-bots', support: 'Chat / soporte' };
  const KPTS = { replay: 3, fingerprint: 3, ads: 2, analytics: 1, security: 0, support: 0 };
  const CK = [[/^(_ga|_gid|_gat|_gac|__utm|_hj|_pk_|ajs_|mp_|amplitude|_clck|_clsk|_cl_|_dc_gtm)/i, 'analítica'], [/^(_fbp|_fbc|_gcl|fr$|ide$|_ttp|_tt_|_uet|__hstc|hubspotutk|__hssc|_pin_|li_|_rdt|test_cookie|_scid)/i, 'publicidad'], [/(sess|sid$|token|csrf|xsrf|auth|jwt|login|phpsessid|jsessionid)/i, 'sesión / seguridad'], [/(lang|locale|theme|consent|cookie|currency|country)/i, 'preferencias']];

  function privacyReport(d) {
    const p = d.privacy || {}, sg = p.signals || {}, risks = [], actions = [], rk = (sev, area, t, detail, fix) => risks.push({ sev, area, t, detail: detail || '', fix: fix || '' });
    // 1. Quién recibe datos
    const seen = new Map();
    const hosts = (d.perf.thirdPartyAll || d.perf.thirdParty.map(x => x.h));
    hosts.forEach(h => { for (const [re, name, kind, what] of TRK) { if (re.test(h)) { const k = name; const e = seen.get(k) || { name, kind, what, hosts: [] }; e.hosts.push(h); seen.set(k, e); break; } } });
    const collectors = Array.from(seen.values()).sort((a, b) => KPTS[b.kind] - KPTS[a.kind]);
    const consent = d.techs.filter(t => t.c === 'consent');
    let pts = collectors.reduce((x, c) => x + KPTS[c.kind], 0);
    // 2. Cookies
    const cookies = (p.cookieNames || []).map(n => ({ n, type: (CK.find(([re]) => re.test(n)) || [, 'sin clasificar'])[1] }));
    const ids = (p.local || []).filter(x => /(uid|user|visitor|client|fingerprint|device|anon|track|_id$|^id$|session|token)/i.test(x.k));
    // 3. Riesgos
    const rep = collectors.filter(c => c.kind === 'replay'), fp = collectors.filter(c => c.kind === 'fingerprint'), ads = collectors.filter(c => c.kind === 'ads');
    if (rep.length) { rk('alta', 'privacidad', 'Esta página puede grabar tu sesión: ' + rep.map(c => c.name).join(', '), 'Captura clics, scroll y movimientos; algunas configuraciones también registran lo que escribes en campos.', 'No escribas datos sensibles aquí; bloquea estos scripts con uBlock Origin.'); pts += 2; }
    if (fp.length || sg.canvasFp || sg.webglFp || sg.audioFp) { rk('alta', 'privacidad', 'Indicios de huella digital del dispositivo' + (fp.length ? ': ' + fp.map(c => c.name).join(', ') : ''), [sg.canvasFp && 'canvas', sg.webglFp && 'WebGL', sg.audioFp && 'audio'].filter(Boolean).join(' · ') + (sg.canvasFp || sg.webglFp || sg.audioFp ? ' (heurística: verificar)' : ''), 'Usa un navegador/extensión con protección anti-fingerprinting (Brave, Firefox ETP estricto, Privacy Badger).'); pts += 2; }
    if (ads.length >= 2) rk('media', 'privacidad', `${ads.length} redes publicitarias reciben datos de tu visita`, ads.map(c => c.name).join(', '), 'Instala un bloqueador de anuncios/rastreadores y bloquea cookies de terceros.');
    if (collectors.some(c => c.kind === 'analytics' || c.kind === 'ads') && !consent.length) rk('media', 'privacidad', 'Te rastrean sin gestor de consentimiento detectado', 'Verificar: es posible que el aviso use un componente propio.', 'Rechaza o limita cookies si aparece el aviso; revisa la política de privacidad.');
    if (sg.keylog) rk('alta', 'seguridad', 'Script que escucha el teclado y envía datos a la red', 'Patrón compatible con captura de teclas (heurística: puede ser un buscador o validación legítimos).', 'No escribas contraseñas ni tarjetas hasta verificar el sitio; revisa los scripts en DevTools > Sources.');
    if (sg.miner) rk('alta', 'seguridad', 'Indicios de minería de criptomonedas en tu navegador', 'Usaría tu CPU sin que lo notes.', 'Cierra la pestaña; usa bloqueo de miners (uBlock Origin / NoCoin).');
    if (sg.obfuscated) rk('media', 'seguridad', 'Código ofuscado (eval/atob/escapes largos)', 'Es típico de malware y de publicidad agresiva, aunque algunas librerías legítimas lo usan.', 'Evita descargar archivos o instalar nada desde este sitio.');
    if (sg.clipboardRead) rk('media', 'privacidad', 'El sitio intenta leer tu portapapeles', '', 'Revoca el permiso del portapapeles para este sitio.');
    if (sg.webrtc) rk('baja', 'privacidad', 'Usa WebRTC: puede revelar tu IP local/real aunque uses VPN', '', 'Si usas VPN, desactiva WebRTC leak (extensión WebRTC Control o ajustes de Brave/Firefox).');
    if (sg.devices) rk('baja', 'privacidad', 'Consulta tus dispositivos de cámara/micrófono', '', 'Revisa permisos de cámara y micrófono del sitio.');
    // Permisos concedidos
    const NAMES = { geolocation: 'tu ubicación', notifications: 'enviarte notificaciones', camera: 'tu cámara', microphone: 'tu micrófono', 'clipboard-read': 'leer tu portapapeles', midi: 'dispositivos MIDI' };
    const granted = Object.entries(p.permissions || {}).filter(([, v]) => v === 'granted').map(([k]) => k);
    granted.forEach(k => rk(k === 'camera' || k === 'microphone' || k === 'geolocation' ? 'alta' : 'media', 'privacidad', 'Este sitio ya tiene permiso para acceder a ' + NAMES[k], 'Concedido por ti en el pasado.', 'Revócalo en la configuración del sitio si ya no lo necesitas.'));
    // Formularios y credenciales
    (p.forms || []).forEach(f => {
      const what = f.cats.join(', ');
      if (f.pw && !d.security.https) rk('alta', 'seguridad', 'Pide contraseña en una página sin HTTPS', 'Cualquiera en tu red puede leerla.', 'No ingreses la contraseña. Si ya lo hiciste, cámbiala donde la uses y activa 2FA.');
      else if (!f.https) rk('alta', 'seguridad', 'Un formulario envía datos por HTTP sin cifrar (' + what + ')', 'Destino: ' + f.host, 'No completes el formulario.');
      if (f.pw && f.cross) rk('alta', 'seguridad', 'El formulario con contraseña envía a otro dominio: ' + f.host, 'Señal típica de phishing o de login delegado (SSO). Verificar.', 'Comprueba que ' + f.host + ' sea el proveedor oficial (Google, Microsoft…). Si dudas, cierra la pestaña y entra escribiendo la URL a mano.');
      else if (f.cross && f.cats.some(c => ['tarjeta de pago', 'documento de identidad'].includes(c))) rk('media', 'privacidad', 'Datos sensibles (' + what + ') se envían a otro dominio: ' + f.host, 'Puede ser un procesador de pagos legítimo. Verificar.', 'Confirma el nombre del procesador antes de pagar.');
      if (f.pw && f.method === 'get') rk('alta', 'seguridad', 'El formulario envía la contraseña por método GET (queda en la URL)', '', 'No lo uses.');
    });
    // Phishing / dominio
    const sh = p.suspectHost || {};
    if (sh.punycode) rk('alta', 'seguridad', 'El dominio usa caracteres internacionales disfrazados (punycode): posible suplantación', d.host, 'Verifica la URL letra por letra antes de ingresar datos.');
    if (sh.ipHost) rk('media', 'seguridad', 'El sitio se sirve desde una dirección IP, no desde un dominio', '', 'Desconfía: los sitios legítimos usan dominio y HTTPS.');
    if (sh.atInUrl) rk('alta', 'seguridad', 'La URL contiene "@": técnica para ocultar el dominio real', '', 'Cierra la pestaña.');
    if (!d.security.https) rk('alta', 'seguridad', 'Conexión sin cifrar: otros pueden ver o alterar lo que envías y recibes', '', 'No ingreses datos personales; usa la versión HTTPS si existe.');
    if (d.security.mixed) rk('media', 'seguridad', `${d.security.mixed} recursos se cargan sin cifrar dentro de una página segura`, '', 'Un atacante en tu red podría alterarlos.');
    // Cadena de suministro y clickjacking
    if (p.noSri > 5) rk('baja', 'seguridad', `${p.noSri} scripts de terceros se cargan sin verificación de integridad (SRI)`, 'Si uno de esos proveedores es comprometido, ejecutaría código en la página (cadena de suministro).', 'Responsabilidad del sitio; como visitante, evita ingresar datos sensibles aquí.');
    const hid = (p.iframes || []).filter(f => f.hidden);
    if (hid.length) rk('media', 'privacidad', `${hid.length} iframes ocultos de terceros: ${Array.from(new Set(hid.map(f => f.h))).slice(0, 4).join(', ')}`, 'Se usan para sincronizar identificadores o rastrear sin que lo veas.', 'Bloquea cookies y rastreadores de terceros.');
    if (!(d.security.headers['x-frame-options'] || /frame-ancestors/i.test(d.security.headers['content-security-policy'] || '')) && d.security.headersOk && (p.passwordFields || (p.forms || []).length)) rk('baja', 'seguridad', 'Podrían incrustar esta página con formularios en otra (clickjacking)', '', 'Responsabilidad del sitio.');
    if (ids.length) rk('baja', 'privacidad', 'Guarda identificadores en tu navegador: ' + ids.slice(0, 5).map(x => x.k).join(', '), 'Permiten reconocerte en visitas futuras.', 'Borra los datos del sitio si no quieres ser reconocido.');
    // Nivel y acciones
    const level = pts >= 8 ? 'alto' : pts >= 3 ? 'medio' : 'bajo';
    const sevs = risks.map(r => r.sev);
    const critical = sevs.includes('alta') && risks.some(r => r.area === 'seguridad' && r.sev === 'alta');
    if (critical) actions.push({ id: 'close', t: 'Cierra la pestaña y no ingreses datos', d: 'Hay señales de riesgo directo para tus cuentas o tu equipo. Si ya escribiste credenciales: cambia esa contraseña, activa verificación en dos pasos y revisa los accesos recientes de la cuenta.' });
    if (granted.length) actions.push({ id: 'site', t: 'Revisa y revoca los permisos de este sitio', d: 'Abre la configuración del sitio en Chrome.' });
    actions.push({ id: 'site', t: 'Borra las cookies y datos que este sitio guardó de ti', d: 'En la configuración del sitio, pulsa «Borrar datos».' });
    if (collectors.length >= 2) actions.push({ id: 'blocker', t: 'Instala un bloqueador de rastreadores', d: 'uBlock Origin o Privacy Badger bloquean la mayoría de lo listado arriba.' });
    if (collectors.length) actions.push({ id: 'cookies3', t: 'Bloquea las cookies de terceros en Chrome', d: 'Reduce el rastreo entre sitios.' });
    actions.push({ id: 'tips', t: 'Buenas prácticas para tus cuentas', d: 'Usa un gestor de contraseñas (solo autocompleta en el dominio correcto), activa 2FA con app o llave, y no reutilices contraseñas.' });
    return { level, collectors, cookies, ids, local: p.local || [], session: p.session || [], idb: p.idb || [], forms: p.forms || [], permissions: p.permissions || {}, signals: sg, visible: p.visible || {}, risks, actions, consent: consent.map(t => t.n), origin: p.origin || '' };
  }


  // Cookies a fondo (requiere permiso opcional chrome.cookies)
  function cookieAudit(list, host, https) {
    const out = { rows: [], issues: [] };
    const sessionish = /(sess|sid$|token|auth|jwt|login|phpsessid|jsessionid)/i;
    list.forEach(c => {
      const cls = (CK.find(([re]) => re.test(c.name)) || [, 'sin clasificar'])[1];
      const first = c.domain.replace(/^[.]/, '') === host || host.endsWith(c.domain.replace(/^[.]/, ''));
      const days = c.session ? null : Math.round((c.expirationDate * 1000 - Date.now()) / 86400000);
      out.rows.push({ n: c.name, dom: c.domain, cls, first, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite, session: !!c.session, days, size: (c.value || '').length });
      if (sessionish.test(c.name) && !c.httpOnly) out.issues.push(['alta', `Cookie de sesión «${c.name}» sin HttpOnly`, 'Un XSS podría robarla.', 'Marcar la cookie como HttpOnly.']);
      if (https && !c.secure && (sessionish.test(c.name) || cls === 'sesión / seguridad')) out.issues.push(['media', `Cookie «${c.name}» sin Secure`, 'Puede viajar sin cifrar.', 'Agregar el atributo Secure.']);
      if (c.sameSite === 'no_restriction' && !c.secure) out.issues.push(['alta', `Cookie «${c.name}» con SameSite=None sin Secure`, 'Los navegadores modernos la rechazan.', 'Agregar Secure o usar SameSite=Lax.']);
      if (c.sameSite === 'unspecified' && sessionish.test(c.name)) out.issues.push(['baja', `Cookie «${c.name}» sin SameSite explícito`, '', 'Definir SameSite=Lax o Strict.']);
      if (!c.session && days > 400) out.issues.push(['baja', `Cookie «${c.name}» dura ${days} días`, 'Chrome limita a 400 días.', 'Reducir la duración al mínimo necesario.']);
    });
    out.total = out.rows.length; out.third = out.rows.filter(r => !r.first).length; out.noHttpOnly = out.rows.filter(r => !r.httpOnly).length;
    return out;
  }
  function verdict(d, a, pv) {
    const n = pv.collectors.length, hi = a.counts.alta;
    const lvl = pv.risks.some(r => r.area === 'seguridad' && r.sev === 'alta') ? 'bad' : (pv.level === 'alto' || hi >= 3) ? 'warn' : (pv.level === 'medio' || a.overall < 75) ? 'mid' : 'good';
    const t = { bad: 'Precaución: hay señales de riesgo directo para tus cuentas o tu equipo.', warn: 'Uso con cuidado: te rastrean de forma intensa o tiene fallos importantes.', mid: 'Aceptable, con puntos a mejorar y rastreo moderado.', good: 'Sin señales de riesgo relevantes con las comprobaciones disponibles.' }[lvl];
    return { lvl, text: t, facts: { n, hi, overall: a.overall } };
  }

  function audit(d) {
    const out = [];
    const add = (area, sev, t, detail, fix) => out.push({ area, sev, t, detail: detail || '', fix: fix || '' });
    const p = d.page, s = d.structure, f = d.perf, sec = d.security, h = sec.headers || {};
    const techs = d.techs, has = (n) => techs.find(t => t.n === n);
    const hg = headerGrade(sec);

    // Seguridad
    if (sec.https) add('seguridad', 'ok', 'HTTPS activo'); else add('seguridad', 'alta', 'El sitio no usa HTTPS', 'Los datos viajan sin cifrar.', 'Instalar certificado TLS (p. ej. Let\'s Encrypt) y redirigir todo a HTTPS.');
    if (sec.mixed) add('seguridad', 'alta', `Contenido mixto: ${sec.mixed} recursos por HTTP`, '', 'Servir todos los recursos por HTTPS.');
    if (sec.headersOk) {
      const tip = { 'HSTS': ['alta', 'Sin HSTS: el navegador no fuerza la conexión segura', 'Enviar Strict-Transport-Security: max-age=31536000; includeSubDomains'],
        'CSP': ['media', 'Sin Content-Security-Policy', 'Definir una CSP que limite el origen de scripts y estilos.'],
        'X-Frame-Options': ['media', 'Sin protección contra clickjacking', 'Enviar X-Frame-Options: SAMEORIGIN o CSP frame-ancestors.'],
        'X-Content-Type-Options': ['baja', 'Falta X-Content-Type-Options', 'Enviar X-Content-Type-Options: nosniff.'],
        'Referrer-Policy': ['baja', 'Falta Referrer-Policy', 'Enviar Referrer-Policy: strict-origin-when-cross-origin.'],
        'Permissions-Policy': ['baja', 'Falta Permissions-Policy', 'Restringir cámara, micrófono y geolocalización si no se usan.'] };
      for (const k in hg.checks) hg.checks[k] ? add('seguridad', 'ok', k + ' presente') : add('seguridad', ...tip[k].slice(0, 2), '', tip[k][2]);
      if (/[0-9]+\.[0-9]+/.test(h['server'] || '')) add('seguridad', 'baja', 'El servidor publica su versión: ' + h['server'], 'Facilita buscar vulnerabilidades conocidas.', 'Ocultar la versión (server_tokens off / ServerTokens Prod).');
      if (h['x-powered-by']) add('seguridad', 'baja', 'Cabecera X-Powered-By expuesta: ' + h['x-powered-by'], '', 'Eliminar la cabecera X-Powered-By.');
    } else add('seguridad', 'baja', 'No se pudieron leer las cabeceras HTTP', 'La página bloquea la re-petición (CSP/red).', 'Verificar manualmente con curl -I.');
    if (p.generator && /[0-9]+\.[0-9]+/.test(p.generator)) add('seguridad', 'alta', 'La página publica su versión en el meta generator: ' + p.generator, 'Un atacante puede cruzarla con CVE conocidas.', 'Quitar el meta generator o su versión.');

    // Obsolescencia (Verificar contra fuentes oficiales antes de actuar)
    const eol = (n, test, sev, t, fix) => { const x = has(n); if (x && test(x.v)) add('seguridad', sev, `${n}${x.v ? ' ' + x.v : ''}: ${t}`, '', fix); };
    eol('AngularJS', () => true, 'alta', 'sin soporte desde dic-2021', 'Migrar a Angular, Vue o React.');
    eol('jQuery', v => v && lt(v, '3.5.0'), 'media', 'versión con XSS conocidos (CVE-2020-11022/11023)', 'Actualizar a jQuery 3.5.0 o superior.');
    eol('Bootstrap', v => v && lt(v, '4.0.0'), 'media', 'versión 3 o anterior, fuera de soporte', 'Actualizar a Bootstrap 5.');
    eol('Moment.js', () => true, 'baja', 'en modo mantenimiento', 'Considerar date-fns, Luxon o Day.js.');
    eol('PHP', v => v && lt(v, '8.1.0'), 'media', 'versión sin soporte de seguridad (verificar en php.net/supported-versions)', 'Actualizar a una versión de PHP con soporte.');


    // Cabeceras en profundidad
    if (sec.headersOk) {
      const csp = h['content-security-policy'] || '';
      if (csp) {
        const dir = {}; csp.split(';').forEach(x => { const [k, ...v] = x.trim().split(/\s+/); if (k) dir[k.toLowerCase()] = v.join(' '); });
        const sc = dir['script-src'] !== undefined ? dir['script-src'] : dir['default-src'];
        if (sc === undefined) add('seguridad', 'media', 'La CSP no restringe scripts (sin script-src ni default-src)', '', 'Agregar script-src o default-src.');
        else {
          if (/'unsafe-inline'/.test(sc) && !/'(nonce-|sha(256|384|512)-)/.test(sc)) add('seguridad', 'media', "La CSP permite 'unsafe-inline' en scripts", 'Anula gran parte de la protección contra XSS.', 'Usar nonces o hashes en lugar de unsafe-inline.');
          if (/'unsafe-eval'/.test(sc)) add('seguridad', 'baja', "La CSP permite 'unsafe-eval'", '', 'Eliminar eval() y retirar unsafe-eval.');
          if (/(^|\s)(\*|https?:|data:)(\s|$)/.test(sc)) add('seguridad', 'media', 'La CSP de scripts admite comodines (*, http:, data:)', '', 'Listar solo los orígenes necesarios.');
        }
        if (!dir['object-src'] && !dir['default-src']) add('seguridad', 'baja', 'La CSP no define object-src', '', "Agregar object-src 'none'.");
        if (!dir['base-uri']) add('seguridad', 'baja', 'La CSP no define base-uri', '', "Agregar base-uri 'self'.");
      } else if (h['content-security-policy-report-only']) add('seguridad', 'baja', 'La CSP está solo en modo informe (Report-Only)', 'No bloquea nada todavía.', 'Pasar a modo de cumplimiento cuando los informes estén limpios.');
      const hs = h['strict-transport-security'];
      if (hs) {
        const ma = +((/max-age=([0-9]+)/i.exec(hs) || [])[1] || 0);
        if (ma < 15552000) add('seguridad', 'baja', `HSTS con max-age corto (${Math.round(ma / 86400)} días)`, '', 'Usar max-age de al menos 15552000 (180 días); ideal 31536000.');
        if (!/includeSubDomains/i.test(hs)) add('seguridad', 'baja', 'HSTS sin includeSubDomains', '', 'Agregar includeSubDomains cuando todos los subdominios usen HTTPS.');
      }
      if (/^(unsafe-url|no-referrer-when-downgrade)$/i.test((h['referrer-policy'] || '').trim())) add('seguridad', 'baja', 'Referrer-Policy filtra la URL completa a terceros: ' + h['referrer-policy'], '', 'Usar strict-origin-when-cross-origin.');
      if (h['access-control-allow-origin'] === '*' && /true/i.test(h['access-control-allow-credentials'] || '')) add('seguridad', 'alta', 'CORS abierto (*) con credenciales', '', 'Restringir Access-Control-Allow-Origin a orígenes concretos.');
      if ((p.title || sec.cookies.length) && d.privacy && d.privacy.passwordFields && !/no-store/i.test(h['cache-control'] || '')) add('seguridad', 'baja', 'Página con campos de contraseña sin Cache-Control: no-store', '', 'Evitar que se guarde en caché de proxies o del navegador.');
    }
    // Archivos públicos
    const fl = d.files;
    if (fl) {
      if (fl.robots.ok && fl.robots.disallowAll) add('seo', 'alta', 'robots.txt bloquea todo el sitio (Disallow: /)', '', 'Quitar el bloqueo si el sitio debe indexarse.');
      else if (!fl.robots.ok) add('seo', 'baja', 'No se encontró robots.txt', '', 'Publicar /robots.txt con la referencia al sitemap.'); else add('seo', 'ok', 'robots.txt presente');
      if (!fl.sitemap.ok) add('seo', 'baja', 'No se encontró sitemap.xml', '', 'Publicar un sitemap y referenciarlo en robots.txt.'); else add('seo', 'ok', 'Sitemap presente' + (fl.sitemap.urls ? ` (${fl.sitemap.urls} entradas)` : ''));
      if (fl.robots.sensitive && fl.robots.sensitive.length) add('seguridad', 'baja', 'robots.txt delata rutas sensibles: ' + fl.robots.sensitive.join(', '), 'Los atacantes leen robots.txt para encontrar paneles ocultos.', 'Proteger esas rutas con autenticación; no depender de robots.txt.');
      fl.security.ok ? add('seguridad', 'ok', 'security.txt publicado') : add('seguridad', 'baja', 'Sin /.well-known/security.txt', 'Los investigadores no saben cómo reportar vulnerabilidades.', 'Publicar security.txt (RFC 9116) con un contacto.');
    }
    // SEO / accesibilidad / rendimiento extra
    if (s.words < 300 && s.words > 0) add('seo', 'baja', `Contenido escaso: ${s.words} palabras visibles`, '', 'Ampliar el contenido útil de la página.');
    if (s.headingSkips) add('accesibilidad', 'baja', `${s.headingSkips} saltos en la jerarquía de encabezados`, '', 'No saltar niveles (H2 → H4).');
    if (s.genericLinks) add('seo', 'baja', `${s.genericLinks} enlaces con texto genérico («aquí», «ver más»)`, '', 'Usar textos descriptivos para accesibilidad y SEO.');
    if (s.dupIds) add('accesibilidad', 'baja', `${s.dupIds} IDs duplicados en el HTML`, '', 'Los id deben ser únicos.');
    if (s.tabindexPos) add('accesibilidad', 'baja', `${s.tabindexPos} elementos con tabindex positivo`, '', 'Usar tabindex 0 o -1 y orden natural del DOM.');
    if (s.iframesNoTitle) add('accesibilidad', 'baja', `${s.iframesNoTitle} iframes sin título`, '', 'Agregar title a cada iframe.');
    if (s.autoplay) add('accesibilidad', 'media', `${s.autoplay} medios con autoplay y sonido`, '', 'Silenciar o quitar la reproducción automática.');
    if (f.cls != null) f.cls > 0.25 ? add('rendimiento', 'alta', `CLS deficiente: ${f.cls}`, 'La página «salta» mientras carga.', 'Reservar espacio para imágenes, anuncios y fuentes.') : f.cls > 0.1 ? add('rendimiento', 'media', `CLS mejorable: ${f.cls}`, '', 'Declarar dimensiones de imágenes y reservar espacio.') : add('rendimiento', 'ok', `CLS ${f.cls}`);
    if (f.beacons > 10) add('privacidad', 'baja', `${f.beacons} envíos de telemetría en segundo plano (beacons)`, 'Datos enviados sin que lo notes.', 'Usar un bloqueador de rastreadores.');

    // SEO
    const tl = p.title.length;
    if (!tl) add('seo', 'alta', 'La página no tiene <title>', '', 'Agregar un título único de 30–60 caracteres.');
    else if (tl < 20 || tl > 70) add('seo', 'media', `Título de ${tl} caracteres (ideal 30–60)`, p.title, 'Ajustar la longitud para que no se trunque en Google.'); else add('seo', 'ok', 'Título con longitud adecuada');
    const dl = p.description.length;
    if (!dl) add('seo', 'media', 'Sin meta description', '', 'Agregar una descripción de 70–160 caracteres.');
    else if (dl < 50 || dl > 170) add('seo', 'baja', `Meta description de ${dl} caracteres (ideal 70–160)`, '', 'Ajustar la longitud.'); else add('seo', 'ok', 'Meta description correcta');
    const h1 = s.headings[0];
    if (h1 === 0) add('seo', 'media', 'La página no tiene título principal (H1)', '', 'Agregar un único H1 descriptivo.');
    else if (h1 > 1) add('seo', 'baja', `Hay ${h1} H1 en la página`, '', 'Dejar un solo H1 y usar H2–H3 para subsecciones.'); else add('seo', 'ok', 'Un único H1');
    if (!p.lang) add('seo', 'media', 'Falta el atributo lang en <html>', '', 'Agregar <html lang="es"> (o el idioma que corresponda).'); else add('seo', 'ok', 'Idioma declarado: ' + p.lang);
    if (!p.canonical) add('seo', 'baja', 'Sin URL canónica', '', 'Agregar <link rel="canonical">.'); else add('seo', 'ok', 'URL canónica definida');
    if (!p.viewport) add('seo', 'alta', 'Sin meta viewport: no es adecuado para móviles', '', 'Agregar <meta name="viewport" content="width=device-width, initial-scale=1">.'); else add('seo', 'ok', 'Meta viewport presente');
    if (/noindex/i.test(p.robots)) add('seo', 'alta', 'La página está marcada como noindex', 'No aparecerá en buscadores.', 'Quitar noindex si debe indexarse.');
    if (!p.ogTitle || !p.ogImage) add('seo', 'baja', 'Open Graph incompleto (og:title / og:image)', 'Mala vista previa al compartir.', 'Completar las etiquetas Open Graph.'); else add('seo', 'ok', 'Open Graph completo');
    if (!p.favicon) add('seo', 'baja', 'Sin favicon declarado', '', 'Agregar <link rel="icon">.');
    if (!p.jsonLd.length) add('seo', 'baja', 'Sin datos estructurados (JSON-LD)', '', 'Agregar schema.org (Organization, Article, Product…).'); else add('seo', 'ok', 'Datos estructurados: ' + p.jsonLd.join(', '));

    // Rendimiento
    if (f.ttfb != null) f.ttfb > 1000 ? add('rendimiento', 'alta', `TTFB lento: ${f.ttfb} ms`, '', 'Revisar caché de servidor, CDN y consultas a BD.') : f.ttfb > 600 ? add('rendimiento', 'media', `TTFB mejorable: ${f.ttfb} ms`, '', 'Activar caché de página y/o CDN.') : add('rendimiento', 'ok', `TTFB ${f.ttfb} ms`);
    if (f.lcp != null) f.lcp > 4000 ? add('rendimiento', 'alta', `LCP deficiente: ${(f.lcp / 1000).toFixed(1)} s`, '', 'Optimizar la imagen/bloque principal, precargarlo y reducir JS bloqueante.') : f.lcp > 2500 ? add('rendimiento', 'media', `LCP mejorable: ${(f.lcp / 1000).toFixed(1)} s`, '', 'Optimizar el elemento principal de la página.') : add('rendimiento', 'ok', `LCP ${(f.lcp / 1000).toFixed(1)} s`);
    if (f.requests > 120) add('rendimiento', 'media', `${f.requests} peticiones HTTP`, '', 'Combinar, diferir o eliminar recursos innecesarios.'); else add('rendimiento', 'ok', `${f.requests} peticiones HTTP`);
    if (s.renderBlocking > 0) add('rendimiento', s.renderBlocking > 3 ? 'media' : 'baja', `${s.renderBlocking} scripts bloquean el renderizado en <head>`, '', 'Agregar defer o async.');
    if (s.domNodes > 3000) add('rendimiento', 'media', `DOM muy grande: ${s.domNodes} nodos`, '', 'Simplificar el HTML y paginar listas largas.'); else if (s.domNodes > 1500) add('rendimiento', 'baja', `DOM grande: ${s.domNodes} nodos`);
    if (f.legacyImg > 3 && f.legacyImg > f.modernImg) add('rendimiento', 'baja', `${f.legacyImg} imágenes JPG/PNG/GIF y ${f.modernImg} en WebP/AVIF`, '', 'Convertir a WebP o AVIF.');
    if (s.imagesNoSize > 3) add('rendimiento', 'baja', `${s.imagesNoSize} imágenes sin width/height (riesgo de saltos de diseño)`, '', 'Declarar width y height en <img>.');
    if (sec.headersOk && !h['content-encoding'] && p.title) add('rendimiento', 'baja', 'La respuesta HTML no indica compresión (gzip/br)', 'Verificar: la re-petición puede omitirla.', 'Activar compresión Brotli o gzip.');
    if (f.thirdPartyHosts > 15) add('rendimiento', 'media', `${f.thirdPartyHosts} dominios de terceros`, '', 'Reducir terceros o cargarlos de forma diferida.');

    // Accesibilidad
    s.imagesNoAlt ? add('accesibilidad', s.imagesNoAlt > 5 ? 'media' : 'baja', `${s.imagesNoAlt} imágenes sin atributo alt`, '', 'Agregar alt descriptivo (o alt="" si es decorativa).') : add('accesibilidad', 'ok', 'Todas las imágenes tienen alt');
    s.inputsUnlabeled ? add('accesibilidad', 'media', `${s.inputsUnlabeled} campos de formulario sin etiqueta`, '', 'Asociar <label for> o aria-label.') : s.inputs && add('accesibilidad', 'ok', 'Campos de formulario etiquetados');
    s.buttonsNoName && add('accesibilidad', 'media', `${s.buttonsNoName} botones sin nombre accesible`, '', 'Agregar texto o aria-label.');
    s.linksNoText && add('accesibilidad', 'baja', `${s.linksNoText} enlaces sin texto accesible`, '', 'Agregar texto visible o aria-label.');
    if (s.zoomBlocked) add('accesibilidad', 'media', 'El viewport bloquea el zoom', '', 'Quitar user-scalable=no y maximum-scale=1.');
    if (!s.hasMain) add('accesibilidad', 'baja', 'Sin región <main>', '', 'Envolver el contenido principal en <main>.');
    if (s.headings[0] === 0 && s.headings[1] > 0) add('accesibilidad', 'baja', 'Estructura de encabezados sin H1', '', 'Comenzar la jerarquía en H1.');

    // Privacidad y seguridad del visitante (ver privacyReport)
    const pv = privacyReport(d);
    pv.risks.forEach(r => add(r.area, r.sev, r.t, r.detail, r.fix));
    if (!pv.risks.length) add('privacidad', 'ok', 'No se detectaron riesgos de privacidad conocidos');
    if (d.perf.thirdPartyHosts > 25) add('privacidad', 'baja', `${d.perf.thirdPartyHosts} dominios de terceros reciben la IP del visitante`);

    // Puntajes
    const scores = {};
    Object.keys(AREAS).forEach(a => { scores[a] = Math.max(0, 100 - out.filter(i => i.area === a).reduce((x, i) => x + PEN[i.sev], 0)); });
    const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5);
    const order = { alta: 0, media: 1, baja: 2, ok: 3 };
    out.sort((a, b) => order[a.sev] - order[b.sev]);
    return { issues: out, scores, overall, headerGrade: hg,
      counts: { alta: out.filter(i => i.sev === 'alta').length, media: out.filter(i => i.sev === 'media').length, baja: out.filter(i => i.sev === 'baja').length, ok: out.filter(i => i.sev === 'ok').length } };
  }

  // Resumen compacto para el historial
  const snapshot = (d, a) => ({ host: d.host, trackers: privacyReport(d).collectors.map(c => c.name), third: d.perf.thirdPartyHosts, req: d.perf.requests, lcp: d.perf.lcp, ttfb: d.perf.ttfb, t: d.ts, techs: d.techs.map(t => t.n + (t.v ? '@' + t.v : '')), plugins: Object.entries(d.wp.plugins).map(([k, v]) => k + (v ? '@' + v : '')),
    scores: a.scores, overall: a.overall, counts: a.counts, hdr: a.headerGrade.grade, title: d.page.title });
  function diff(prev, cur) {
    if (!prev) return null;
    const split = (x) => { const m = new Map(); x.forEach(i => { const [n, v] = i.split('@'); m.set(n, v || ''); }); return m; };
    const cmp = (A, B) => { const a = split(A), b = split(B), r = { added: [], removed: [], changed: [] };
      b.forEach((v, n) => { if (!a.has(n)) r.added.push(n + (v ? ' ' + v : '')); else if (a.get(n) !== v) r.changed.push(`${n}: ${a.get(n) || '?'} → ${v || '?'}`); });
      a.forEach((v, n) => { if (!b.has(n)) r.removed.push(n + (v ? ' ' + v : '')); }); return r; };
    return { since: prev.t, techs: cmp(prev.techs, cur.techs), plugins: cmp(prev.plugins || [], cur.plugins || []),
      overall: cur.overall - prev.overall, hdr: prev.hdr !== cur.hdr ? [prev.hdr, cur.hdr] : null, title: prev.title !== cur.title ? [prev.title, cur.title] : null,
      scores: Object.fromEntries(Object.keys(AREAS).map(a => [a, cur.scores[a] - prev.scores[a]])) };
  }

  // DNS: respuesta DoH (JSON) → resumen
  const NS_PROV = [[/cloudflare/, 'Cloudflare'], [/awsdns/, 'Amazon Route 53'], [/googledomains|google/, 'Google Cloud DNS'], [/azure-dns/, 'Azure DNS'], [/domaincontrol/, 'GoDaddy'], [/nsone/, 'NS1'], [/dnsimple/, 'DNSimple'], [/registrar-servers/, 'Namecheap'], [/vercel-dns/, 'Vercel DNS'], [/netlify/, 'Netlify DNS'], [/nic[.]cl/, 'NIC Chile']];
  const MX_PROV = [[/google|googlemail/, 'Google Workspace'], [/outlook|protection[.]outlook/, 'Microsoft 365'], [/zoho/, 'Zoho Mail'], [/proton/, 'Proton Mail'], [/mimecast/, 'Mimecast'], [/pphosted/, 'Proofpoint'], [/secureserver/, 'GoDaddy Mail'], [/mailgun/, 'Mailgun'], [/improvmx/, 'ImprovMX']];
  function dnsSummary(r) {
    const pick = (list, hosts) => Array.from(new Set(hosts.map(h => (list.find(([re]) => re.test(h.toLowerCase())) || [])[1]).filter(Boolean)));
    const txt = r.TXT.map(x => x.replace(/^"|"$/g, '').replace(/" "/g, ''));
    const spf = txt.find(x => /^v=spf1/i.test(x)), dmarc = (r.DMARC || []).map(x => x.replace(/"/g, '')).find(x => /^v=DMARC1/i.test(x));
    const issues = [];
    if (r.MX.length && !spf) issues.push(['media', 'Sin registro SPF', 'Agregar TXT v=spf1 … para evitar suplantación de correo.']);
    if (r.MX.length && !dmarc) issues.push(['media', 'Sin registro DMARC', 'Agregar TXT _dmarc con v=DMARC1; p=quarantine (o reject).']);
    else if (dmarc && /p=none/i.test(dmarc)) issues.push(['baja', 'DMARC en modo p=none (solo monitoreo)', 'Pasar a quarantine/reject cuando el correo esté alineado.']);
    if (!r.CAA.length) issues.push(['baja', 'Sin registros CAA', 'Restringir qué autoridades pueden emitir certificados.']);
    if (!r.AAAA.length) issues.push(['baja', 'Sin IPv6 (AAAA)', 'Opcional: habilitar IPv6.']);
    if (r.dnssec === false) issues.push(['baja', 'DNSSEC no activo', 'Protege contra falsificación de respuestas DNS.', 'Activar DNSSEC en el registrador/proveedor DNS.']);
    if (r.MX.length && !(r.MTASTS || []).length) issues.push(['baja', 'Sin MTA-STS', 'Obliga a cifrar el correo entrante.', 'Publicar TXT _mta-sts y la política en /.well-known/mta-sts.txt.']);
    return { dnssec: r.dnssec, mtasts: (r.MTASTS || []).length > 0, dnsProvider: pick(NS_PROV, r.NS), mailProvider: pick(MX_PROV, r.MX.map(m => m.replace(/^[0-9]+ /, ''))), spf: spf || '', dmarc: dmarc || '',
      verifications: Array.from(new Set(txt.filter(x => /(site-verification|^MS=|facebook-domain|apple-domain|atlassian|stripe-verification|docusign|zoom)/i.test(x)).map(x => x.split(/[=:]/)[0]))), issues };
  }
  // Comparación lado a lado de dos sitios a partir de sus snapshots
  function compare(A, B) {
    const names = (s) => new Set(s.techs.map(t => t.split('@')[0]));
    const a = names(A), b = names(B);
    const shared = [...a].filter(x => b.has(x)), onlyA = [...a].filter(x => !b.has(x)), onlyB = [...b].filter(x => !a.has(x));
    const rows = [['Nota global', A.overall, B.overall, 'hi'], ...Object.keys(AREAS).map(k => [AREAS[k], A.scores[k], B.scores[k], 'hi']),
      ['Servicios de rastreo', (A.trackers || []).length, (B.trackers || []).length, 'lo'], ['Dominios de terceros', A.third, B.third, 'lo'],
      ['Peticiones HTTP', A.req, B.req, 'lo'], ['LCP (ms)', A.lcp, B.lcp, 'lo'], ['TTFB (ms)', A.ttfb, B.ttfb, 'lo']];
    const trA = new Set(A.trackers || []), trB = new Set(B.trackers || []);
    return { rows, hdr: [A.hdr, B.hdr], shared, onlyA, onlyB, trShared: [...trA].filter(x => trB.has(x)), trOnlyA: [...trA].filter(x => !trB.has(x)), trOnlyB: [...trB].filter(x => !trA.has(x)) };
  }
  const markdown = (d, a, dns) => {
    const L = [`# Informe LINCEO DETECTOR: ${d.host}`, `${d.url}  `, `Analizado: ${new Date(d.ts).toLocaleString('es-CL')}`, '',
      `**Nota global:** ${a.overall}/100 · **Cabeceras:** ${a.headerGrade.grade}`, '', '| Área | Puntaje |', '|---|---|', ...Object.keys(AREAS).map(k => `| ${AREAS[k]} | ${a.scores[k]} |`), '', '## Qué mejorar'];
    ['alta', 'media', 'baja'].forEach(sv => { const it = a.issues.filter(i => i.sev === sv); if (it.length) { L.push(`\n**Prioridad ${sv}**`); it.forEach(i => L.push(`- [${AREAS[i.area]}] ${i.t}${i.fix ? ' → ' + i.fix : ''}`)); } });
    L.push('', '## Tecnologías'); d.techs.forEach(t => L.push(`- ${t.n}${t.v ? ' ' + t.v : ''} (${t.c})`));
    if (dns) { L.push('', '## DNS', `- DNS: ${dns.s.dnsProvider.join(', ') || '?'} · Correo: ${dns.s.mailProvider.join(', ') || '?'}`); }
    return L.join('\n');
  };
  return { AREAS, compare, audit, privacyReport, KIND, cookieAudit, verdict, headerGrade, snapshot, diff, dnsSummary, markdown };
})();
if (typeof module !== 'undefined') module.exports = Analysis;
