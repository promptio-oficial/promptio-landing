/* Generadores de HTML compartidos por el popup y el informe. Todo texto externo pasa por esc(). */
const R = (() => {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CAT = { js_framework: 'Frameworks JavaScript', js_library: 'Librerías JavaScript', ui: 'UI / CSS', cms: 'CMS', builder: 'Constructores', ssg: 'Generadores estáticos', ecommerce: 'E-commerce', server: 'Servidores', language: 'Lenguajes y backend', db: 'Bases de datos', os: 'Sistemas operativos', cdn: 'CDN', hosting: 'Hosting', analytics: 'Analítica', tagmanager: 'Gestores de etiquetas', marketing: 'Marketing y publicidad', chat: 'Chat y soporte', payment: 'Pagos', security: 'Seguridad', consent: 'Consentimiento de cookies', font: 'Tipografía', maps: 'Mapas', media: 'Video', build: 'Herramientas de build', misc: 'Misceláneos', wp: 'WordPress (tema y plugins)', other: 'Otros' };
  const VIA = { js: 'variable JS', dom: 'DOM', meta: 'meta', src: 'recurso', html: 'HTML', hdr: 'cabecera', ck: 'cookie', implied: 'inferida' };
  const hue = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const avatar = (n) => `<span class="av" style="background:hsl(${hue(n)} 55% 42%)">${esc(n.replace(/[^A-Za-z0-9]/g, '').slice(0, 2))}</span>`;
  const kb = (b) => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b >= 1024 ? Math.round(b / 1024) + ' KB' : b + ' B';
  const ms = (v) => v == null ? '—' : v >= 1000 ? (v / 1000).toFixed(2) + ' s' : v + ' ms';
  const col = (v) => v >= 85 ? 'good' : v >= 60 ? 'warn' : 'bad';
  const row = (k, v) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`;
  const ring = (label, v) => `<div class="ring ${col(v)}"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" class="bg"/><circle cx="18" cy="18" r="15.9" class="fg" stroke-dasharray="${v} 100" transform="rotate(-90 18 18)"/></svg><b>${v}</b><span>${esc(label)}</span></div>`;

  function scores(a) {
    return `<div class="rings">${ring('Global', a.overall)}${Object.keys(Analysis.AREAS).map(k => ring(Analysis.AREAS[k], a.scores[k])).join('')}
      <div class="grade g${a.headerGrade.grade}"><b>${esc(a.headerGrade.grade)}</b><span>Cabeceras</span></div></div>`;
  }
  function stack(d) {
    const groups = {};
    d.techs.forEach(t => (groups[t.c] = groups[t.c] || []).push(t));
    const wpP = Object.entries(d.wp.plugins), wpT = Object.entries(d.wp.themes);
    if (wpP.length || wpT.length) groups.wp = [...wpT.map(([n, v]) => ({ n: 'Tema: ' + n, v, via: ['src'] })), ...wpP.map(([n, v]) => ({ n, v, via: ['src'] }))];
    const keys = Object.keys(groups).sort((a, b) => Object.keys(CAT).indexOf(a) - Object.keys(CAT).indexOf(b));
    if (!keys.length) return '<p class="empty">No se detectó ninguna tecnología conocida.</p>';
    return `<div class="cards">` + keys.map(k => `<section class="card"><h3>${esc(CAT[k] || k)} <i>${groups[k].length}</i></h3>` +
      groups[k].map(t => `<div class="tech" data-q="${esc((t.n + ' ' + (CAT[k] || '')).toLowerCase())}" title="Evidencia: ${esc(t.via.map(v => VIA[v] || v).join(', '))}">${avatar(t.n)}<span class="nm">${esc(t.n)}</span>${t.v ? `<span class="ver">${esc(t.v)}</span>` : ''}${t.via.includes('implied') && t.via.length === 1 ? '<span class="tag">inferida</span>' : ''}</div>`).join('') + '</section>').join('') + '</div>';
  }
  function issues(a, area) {
    const list = a.issues.filter(i => i.sev !== 'ok' && (!area || i.area === area));
    const oks = a.issues.filter(i => i.sev === 'ok' && (!area || i.area === area));
    let h = '';
    for (const sv of ['alta', 'media', 'baja']) {
      const it = list.filter(i => i.sev === sv); if (!it.length) continue;
      h += `<h4 class="sv ${sv}">Prioridad ${sv} · ${it.length}</h4>` + it.map(i => `<div class="issue ${sv}"><b>${esc(i.t)}</b> <span class="tag">${esc(Analysis.AREAS[i.area])}</span>${i.detail ? `<p>${esc(i.detail)}</p>` : ''}${i.fix ? `<p class="fix">Cómo corregirlo: ${esc(i.fix)}</p>` : ''}</div>`).join('');
    }
    if (!list.length) h += '<p class="empty good">Sin hallazgos en esta área.</p>';
    if (oks.length) h += `<h4 class="sv ok">Correcto · ${oks.length}</h4><ul class="oks">${oks.map(i => `<li>${esc(i.t)}</li>`).join('')}</ul>`;
    return h;
  }
  function security(d, a) {
    const c = a.headerGrade.checks;
    return `<table class="kv">${row('HTTPS', d.security.https ? '<span class="good">Activo</span>' : '<span class="bad">No</span>')}${row('Contenido mixto', d.security.mixed ? `<span class="bad">${d.security.mixed} recursos</span>` : 'No')}` +
      Object.keys(c).map(k => row(k, c[k] ? '<span class="good">Presente</span>' : '<span class="bad">Ausente</span>')).join('') + '</table>';
  }
  function page(d) {
    const p = d.page, s = d.structure;
    return `<table class="kv">${row('Título', esc(p.title) || '—')}${row('Descripción', esc(p.description) || '—')}${row('H1', esc(p.h1.join(' | ')) || '<span class="bad">Ninguno</span>')}${row('Idioma', esc(p.lang) || '—')}${row('Charset', esc(p.charset))}${row('Doctype', esc(p.doctype))}${row('Viewport', esc(p.viewport) || '—')}${row('Canonical', esc(p.canonical) || '—')}${row('Robots', esc(p.robots) || '—')}${row('OG title', esc(p.ogTitle) || '—')}${row('Datos estructurados', esc(p.jsonLd.join(', ')) || '—')}</table>
      <h4 class="sv ok">Estructura</h4><table class="kv">${row('Encabezados H1–H6', s.headings.join(' · '))}${row('Imágenes', `${s.images} (${s.imagesNoAlt} sin alt)`)}${row('Enlaces', `${s.linksInternal} internos · ${s.linksExternal} externos`)}${row('Formularios', s.forms)}${row('Scripts', `${s.scripts} (${s.scriptsExternal} externos, ${s.scriptsInline} en línea)`)}${row('Hojas de estilo', s.stylesheets)}${row('Nodos DOM', s.domNodes)}${row('Palabras visibles', s.words)}</table>`;
  }
  function perf(d) {
    const f = d.perf;
    const m = (l, v, good, bad) => `<div class="metric ${v == null ? '' : v <= good ? 'good' : v <= bad ? 'warn' : 'bad'}"><b>${ms(v)}</b><span>${l}</span></div>`;
    const bb = Object.entries(f.bytesBy).filter(e => e[1]).sort((a, b) => b[1] - a[1]);
    const tot = bb.reduce((x, e) => x + e[1], 0) || 1;
    return `<div class="metrics">${m('TTFB', f.ttfb, 600, 1000)}${m('FCP', f.fcp, 1800, 3000)}${m('LCP', f.lcp, 2500, 4000)}${m('Carga', f.load, 3000, 6000)}</div>
      <table class="kv">${row('Peticiones', f.requests)}${row('Protocolo', esc(f.protocol || '—'))}${row('Transferencia medida', f.bytesKnown ? kb(f.bytes) + ' <small>(los terceros sin TAO reportan 0: estimación a la baja)</small>' : '—')}${row('Imágenes modernas / clásicas', `${f.modernImg} WebP·AVIF / ${f.legacyImg} JPG·PNG·GIF`)}</table>
      ${bb.length ? `<div class="bar">${bb.map(([k, v]) => `<i class="b-${k}" style="width:${Math.max(2, v / tot * 100)}%" title="${k} ${kb(v)}"></i>`).join('')}</div><div class="legend">${bb.map(([k, v]) => `<span><i class="b-${k}"></i>${esc(k)} ${kb(v)}</span>`).join('')}</div>` : ''}
      <h4 class="sv ok">Dominios de terceros · ${f.thirdPartyHosts}</h4>
      <table class="kv tp">${f.thirdParty.slice(0, 15).map(t => `<tr><th>${esc(t.h)}</th><td>${t.n} pet.${t.s ? ' · ' + kb(t.s) : ''}</td></tr>`).join('') || '<tr><td>Ninguno</td></tr>'}</table>`;
  }
  function dns(x) {
    if (!x) return '<p class="empty">Consulta los registros DNS del dominio (A, MX, NS, TXT, CAA, SPF, DMARC). Solo se envía el nombre del dominio a Cloudflare DNS (respaldo: Google DNS).</p>';
    const s = x.s, r = x.records, l = (a) => a.length ? a.map(esc).join('<br>') : '—';
    return `<table class="kv">${row('Dominio', esc(x.domain))}${row('Proveedor DNS', esc(s.dnsProvider.join(', ')) || '—')}${row('Proveedor de correo', esc(s.mailProvider.join(', ')) || '—')}${row('SPF', s.spf ? '<span class="good">Presente</span>' : '<span class="bad">Ausente</span>')}${row('DMARC', s.dmarc ? esc(s.dmarc.slice(0, 80)) : '<span class="bad">Ausente</span>')}${row('Verificaciones', esc(s.verifications.join(', ')) || '—')}${row('A', l(r.A))}${row('AAAA', l(r.AAAA))}${row('NS', l(r.NS))}${row('MX', l(r.MX))}${row('CAA', l(r.CAA))}</table>` +
      (s.issues.length ? s.issues.map(i => `<div class="issue ${i[0]}"><b>${esc(i[1])}</b><p class="fix">Cómo corregirlo: ${esc(i[2])}</p></div>`).join('') : '<p class="empty good">DNS y correo sin hallazgos.</p>');
  }
  function changes(df, hist) {
    if (!df) return '<p class="empty">Primer análisis de este sitio. En el próximo escaneo verás aquí qué tecnologías, versiones y puntajes cambiaron.</p>';
    const ch = (t, a) => a.length ? `<h4 class="sv ok">${t} · ${a.length}</h4><ul class="oks">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
    const sgn = (n) => n > 0 ? `<span class="good">+${n}</span>` : n < 0 ? `<span class="bad">${n}</span>` : '0';
    const none = !df.techs.added.length && !df.techs.removed.length && !df.techs.changed.length && !df.plugins.added.length && !df.plugins.removed.length && !df.plugins.changed.length;
    return `<p class="muted">Comparado con el análisis del ${new Date(df.since).toLocaleString('es-CL')} (${hist} guardados).</p>
      <table class="kv">${row('Nota global', sgn(df.overall))}${Object.keys(Analysis.AREAS).map(k => row(Analysis.AREAS[k], sgn(df.scores[k]))).join('')}${df.hdr ? row('Cabeceras', esc(df.hdr[0] + ' → ' + df.hdr[1])) : ''}${df.title ? row('Título', esc(df.title[0]) + '<br>→ ' + esc(df.title[1])) : ''}</table>` +
      ch('Tecnologías nuevas', df.techs.added) + ch('Tecnologías quitadas', df.techs.removed) + ch('Versiones cambiadas', df.techs.changed) + ch('Plugins nuevos', df.plugins.added) + ch('Plugins quitados', df.plugins.removed) + ch('Plugins con versión distinta', df.plugins.changed) + (none ? '<p class="empty good">Sin cambios en el stack.</p>' : '');
  }

  function privacy(d, pv, interactive) {
    const lv = { alto: ['bad', 'Exposición ALTA'], medio: ['warn', 'Exposición MEDIA'], bajo: ['good', 'Exposición BAJA'] }[pv.level];
    const rep = pv.collectors.filter(c => c.kind === 'replay').length, n = pv.collectors.length;
    const sev = pv.risks.filter(x => x.sev === 'alta').length;
    let h = `<div class="banner ${lv[0]}"><b>${lv[1]}</b><span>${n ? `${n} servicio${n > 1 ? 's' : ''} de terceros recopilan datos de tu visita` : 'No se detectaron servicios de rastreo conocidos'}${rep ? ' · <b>puede grabar tu sesión</b>' : ''}${sev ? ` · ${sev} riesgo${sev > 1 ? 's' : ''} de prioridad alta` : ''}</span></div>`;
    // 1. Qué hacer
    h += '<h4 class="sv alta">Qué hacer ahora</h4>' + pv.actions.map(a => `<div class="todo"><div><b>${esc(a.t)}</b><p>${esc(a.d)}</p></div>${interactive && a.id !== 'close' && a.id !== 'tips' ? `<button data-act="${a.id}" class="act">${{ site: 'Abrir configuración del sitio', blocker: 'Ver uBlock Origin', cookies3: 'Abrir cookies de Chrome' }[a.id]}</button>` : ''}</div>`).join('');
    // 2. Riesgos
    const risks = pv.risks.slice().sort((a, b) => ({ alta: 0, media: 1, baja: 2 }[a.sev] - { alta: 0, media: 1, baja: 2 }[b.sev]));
    h += '<h4 class="sv media">Riesgos detectados</h4>' + (risks.length ? risks.map(i => `<div class="issue ${i.sev}"><b>${esc(i.t)}</b> <span class="tag">${i.area === 'seguridad' ? 'Seguridad' : 'Privacidad'} · ${i.sev}</span>${i.detail ? `<p>${esc(i.detail)}</p>` : ''}${i.fix ? `<p class="fix">Qué hacer: ${esc(i.fix)}</p>` : ''}</div>`).join('') : '<p class="empty good">No se detectaron riesgos con las comprobaciones disponibles.</p>');
    // 3. Quién recibe datos
    h += `<h4 class="sv ok">Quién recibe datos tuyos · ${n}</h4>`;
    h += n ? `<table class="kv">${pv.collectors.map(c => `<tr><th>${esc(c.name)}<br><span class="tag k-${c.kind}">${esc(Analysis.KIND[c.kind])}</span></th><td>${esc(c.what)}<br><small>${esc(c.hosts.slice(0, 3).join(', '))}</small></td></tr>`).join('')}</table>` : '<p class="empty">Ninguno detectado.</p>';
    // 4. Qué guarda de ti
    h += '<h4 class="sv ok">Qué guarda este sitio en tu navegador</h4><table class="kv">';
    h += row('Cookies visibles', pv.cookies.length ? pv.cookies.map(c => `${esc(c.n)} <span class="tag">${esc(c.type)}</span>`).join('<br>') : 'Ninguna legible por JavaScript');
    h += row('localStorage', pv.local.length ? pv.local.slice(0, 12).map(x => `${esc(x.k)} <small>(${x.n} car.)</small>`).join('<br>') : 'Vacío');
    h += row('sessionStorage', pv.session.length ? pv.session.slice(0, 8).map(x => esc(x.k)).join('<br>') : 'Vacío');
    h += row('IndexedDB', pv.idb.length ? pv.idb.map(esc).join('<br>') : 'Ninguna');
    h += '</table>';
    // 5. Formularios
    h += '<h4 class="sv ok">Qué datos te piden y adónde van</h4>';
    h += pv.forms.length ? `<table class="kv">${pv.forms.map(f => row('Formulario → ' + f.host, `${esc(f.cats.join(', '))}<br><small>${f.https ? 'cifrado (HTTPS)' : '<span class="bad">SIN cifrar</span>'} · ${f.cross ? '<span class="warn">otro dominio</span>' : 'mismo sitio'} · ${esc(f.method.toUpperCase())}</small>`)).join('')}</table>` : '<p class="empty">No hay formularios con datos personales en esta página.</p>';
    // 6. Permisos
    const perms = Object.entries(pv.permissions);
    h += '<h4 class="sv ok">Permisos de este sitio</h4>' + (perms.length ? `<table class="kv">${perms.map(([k, v]) => row({ geolocation: 'Ubicación', notifications: 'Notificaciones', camera: 'Cámara', microphone: 'Micrófono', 'clipboard-read': 'Portapapeles', midi: 'MIDI' }[k] || k, v === 'granted' ? '<span class="bad">Concedido</span>' : v === 'denied' ? '<span class="good">Bloqueado</span>' : 'Pregunta antes')).join('')}</table>` : '<p class="empty">No disponible.</p>');
    // 7. Lo que ve cualquier página
    const v = pv.visible;
    h += `<h4 class="sv ok">Lo que cualquier sitio ve de ti sin pedirte permiso</h4><table class="kv">${row('Navegador / sistema', esc(v.ua))}${row('Idioma · zona horaria', esc(v.lang) + ' · ' + esc(v.tz))}${row('Pantalla', esc(v.screen))}${row('Hardware', `${v.cores || '?'} núcleos${v.mem ? ' · ' + v.mem + ' GB' : ''} · ${esc(v.platform)}`)}${row('Señales de privacidad', `No rastrear: ${v.dnt ? 'activado' : 'no'} · Global Privacy Control: ${v.gpc ? 'activado' : 'no'}`)}${row('Además', 'Tu dirección IP y ubicación aproximada llegan siempre al servidor.')}</table>`;
    const sg = pv.signals;
    h += `<p class="muted limits"><b>Límites del análisis:</b> no se pueden ver cookies HttpOnly ni de terceros, ni lo que el servidor guarda de ti. Revisados ${sg.scanned || 0} KB de código propio; ${sg.unreadable || 0} scripts de terceros no son legibles. Las señales de comportamiento son heurísticas: <b>verificar</b> antes de concluir.</p>`;
    return h;
  }
  return { esc, scores, privacy, stack, issues, security, page, perf, dns, changes, CAT };
})();
