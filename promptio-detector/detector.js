/* Se inyecta en la página (world MAIN). Debe ser autocontenida: no puede usar nada externo.
   Recoge todo en una sola pasada y no envía nada fuera del navegador. */
async function scanPage(SIGS) {
  const D = document, L = location, W = window;
  const q = (s, r = D) => { try { return r.querySelector(s); } catch (e) { return null; } };
  const qa = (s, r = D) => { try { return Array.from(r.querySelectorAll(s)); } catch (e) { return []; } };
  const txt = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const cut = (s, n) => { s = txt(s); return s.length > n ? s.slice(0, n) + '…' : s; };
  const okVer = (v) => (v && /^[0-9][0-9A-Za-z.\-_+]{0,23}$/.test(String(v))) ? String(v) : '';
  const getPath = (path) => { try { return path.split('.').reduce((o, k) => o[k], W); } catch (e) { return undefined; } };

  // ── Meta
  const meta = {};
  qa('meta').forEach(m => {
    const k = (m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('http-equiv') || '').toLowerCase();
    if (k && !(k in meta)) meta[k] = m.getAttribute('content') || '';
  });

  // ── Cabeceras HTTP (re-petición same-origin; no es la petición original)
  let headers = null, status = null, redirected = false;
  try {
    let r = await fetch(L.href, { method: 'HEAD', credentials: 'same-origin', cache: 'no-store' });
    if (!r.ok) {
      const ac = new AbortController();
      r = await fetch(L.href, { credentials: 'same-origin', cache: 'no-store', signal: ac.signal });
      ac.abort();
    }
    status = r.status; redirected = r.redirected; headers = {};
    r.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  } catch (e) { /* CSP o red: se continúa sin cabeceras */ }

  // ── Recursos y rendimiento
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const res = performance.getEntriesByType('resource').map(e => ({
    u: e.name, t: e.initiatorType, s: e.transferSize || e.encodedBodySize || 0, d: Math.round(e.duration)
  }));
  let lcp = null;
  await new Promise(done => {
    try {
      const po = new PerformanceObserver(l => { const e = l.getEntries(); if (e.length) lcp = Math.round(e[e.length - 1].startTime); });
      po.observe({ type: 'largest-contentful-paint', buffered: true });
      setTimeout(() => { po.disconnect(); done(); }, 80);
    } catch (e) { done(); }
  });
  const fcpE = performance.getEntriesByName('first-contentful-paint')[0];

  const urlSet = new Set(res.map(r => r.u));
  qa('script[src]').forEach(e => urlSet.add(e.src));
  qa('link[href]').forEach(e => urlSet.add(e.href));
  qa('iframe[src]').forEach(e => urlSet.add(e.src));
  qa('img[src]').slice(0, 300).forEach(e => urlSet.add(e.src));
  const urls = Array.from(urlSet);
  const urlText = urls.join('\n');
  const html = D.documentElement.outerHTML.slice(0, 600000);

  // ── Dominio registrable aproximado
  const SLD = new Set(['co', 'com', 'org', 'net', 'gov', 'edu', 'ac', 'gob']);
  const base = (h) => {
    const p = h.split('.');
    if (p.length <= 2) return h;
    return (p[p.length - 2].length <= 3 && SLD.has(p[p.length - 2]) && p[p.length - 1].length === 2)
      ? p.slice(-3).join('.') : p.slice(-2).join('.');
  };
  const myBase = base(L.hostname);

  // ── Tecnologías
  const found = new Map();
  const hit = (s, via, ver) => {
    let t = found.get(s.n);
    if (!t) { t = { n: s.n, c: s.c, v: '', via: [] }; found.set(s.n, t); }
    if (!t.via.includes(via)) t.via.push(via);
    const v = okVer(ver); if (v && !t.v) t.v = v;
  };
  const winKeys = Object.keys(W);
  const cookieNames = (D.cookie || '').split(';').map(c => c.split('=')[0].trim()).filter(Boolean);
  const rx = (p) => new RegExp(p, 'i');

  for (const s of SIGS) {
    let jsVer;
    if (s.jsv) { const v = getPath(s.jsv); if (typeof v === 'string' || typeof v === 'number') jsVer = v; }
    for (const g of (s.js || [])) { if (getPath(g) !== undefined) { hit(s, 'js', jsVer); break; } }
    if (jsVer !== undefined && !found.has(s.n)) hit(s, 'js', jsVer);
    if (s.jsk) for (const p of s.jsk) { const r = rx(p); if (winKeys.some(k => r.test(k))) { hit(s, 'js'); break; } }
    for (const sel of (s.dom || [])) { if (q(sel)) { hit(s, 'dom'); break; } }
    if (s.domv) { const e = q(s.domv[0]); if (e) hit(s, 'dom', e.getAttribute(s.domv[1])); }
    if (s.meta) for (const k in s.meta) { if (meta[k] !== undefined) { const m = rx(s.meta[k]).exec(meta[k]); if (m) hit(s, 'meta', m[1]); } }
    for (const p of (s.src || [])) { const m = rx(p).exec(urlText); if (m) { hit(s, 'src', m[1]); break; } }
    for (const p of (s.html || [])) { const m = rx(p).exec(html); if (m) { hit(s, 'html', m[1]); break; } }
    if (headers && s.hdr) for (const k in s.hdr) { if (headers[k] !== undefined) { const m = rx(s.hdr[k]).exec(headers[k]); if (m) hit(s, 'hdr', m[1]); } }
    for (const p of (s.ck || [])) { const r = rx(p); if (cookieNames.some(c => r.test(c))) { hit(s, 'ck'); break; } }
  }
  // React / Vue vía propiedades internas de los nodos raíz
  qa('#root,#app,#__next,#__nuxt,body>div,body').slice(0, 12).forEach(el => {
    const ks = Object.keys(el);
    if (ks.some(k => k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$')) || el._reactRootContainer) hit({ n: 'React', c: 'js_framework' }, 'dom');
    if (el.__vue_app__) hit({ n: 'Vue.js', c: 'js_framework' }, 'dom', el.__vue_app__.version);
    else if (el.__vue__) hit({ n: 'Vue.js', c: 'js_framework' }, 'dom');
  });
  // Implícitas
  const byName = new Map(SIGS.map(s => [s.n, s]));
  for (let i = 0; i < 2; i++) for (const t of Array.from(found.values())) {
    const s = byName.get(t.n);
    (s && s.imp || []).forEach(n => { const b = byName.get(n); if (b && !found.has(n)) hit(b, 'implied'); });
  }
  // WordPress: tema y plugins con versión (?ver= del recurso: aproximado)
  const wpPlugins = {}, wpThemes = {};
  urls.forEach(u => {
    let m = /\/wp-content\/plugins\/([a-z0-9_-]+)\/[^?#]*(?:\?[^#]*?ver=([0-9][0-9.]*))?/i.exec(u);
    if (m && !(m[1] in wpPlugins)) wpPlugins[m[1]] = okVer(m[2]); else if (m && !wpPlugins[m[1]] && okVer(m[2])) wpPlugins[m[1]] = okVer(m[2]);
    m = /\/wp-content\/themes\/([a-z0-9_-]+)\/[^?#]*(?:\?[^#]*?ver=([0-9][0-9.]*))?/i.exec(u);
    if (m && !(m[1] in wpThemes)) wpThemes[m[1]] = okVer(m[2]); else if (m && !wpThemes[m[1]] && okVer(m[2])) wpThemes[m[1]] = okVer(m[2]);
  });
  // Varios
  const misc = (n, via, v) => hit({ n, c: 'misc' }, via, v);
  const proto = nav.nextHopProtocol || '';
  if (proto === 'h2') misc('HTTP/2', 'hdr'); else if (proto === 'h3') misc('HTTP/3', 'hdr');
  if (meta['og:title'] || meta['og:image']) misc('Open Graph', 'meta');
  if (meta['twitter:card']) misc('Twitter Cards', 'meta');
  if (q('link[rel="alternate"][type*="rss"],link[rel="alternate"][type*="atom"]')) misc('RSS/Atom', 'dom');
  if (q('link[rel="manifest"]')) misc('Web App Manifest', 'dom');
  if (navigator.serviceWorker && navigator.serviceWorker.controller) misc('Service Worker', 'js');
  if (q('script[type="application/ld+json"]')) misc('Schema.org (JSON-LD)', 'dom');
  if (q('[fetchpriority]')) misc('Priority Hints', 'dom');
  if (q('img[loading="lazy"],iframe[loading="lazy"]')) misc('Lazy loading nativo', 'dom');

  // ── Página
  const jsonLdTypes = [];
  qa('script[type="application/ld+json"]').forEach(s => {
    try { const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (o['@type']) jsonLdTypes.push([].concat(o['@type']).join('/')); if (o['@graph']) walk(o['@graph']); } }; walk(JSON.parse(s.textContent)); } catch (e) {}
  });
  const faviconEl = q('link[rel~="icon"]');
  const page = {
    title: cut(D.title, 200), description: cut(meta['description'], 400),
    h1: qa('h1').slice(0, 3).map(h => cut(h.textContent, 120)),
    lang: D.documentElement.lang || '', charset: D.characterSet || '',
    doctype: D.doctype ? D.doctype.name : '', viewport: meta['viewport'] || '',
    canonical: (q('link[rel="canonical"]') || {}).href || '', robots: meta['robots'] || '',
    ogTitle: cut(meta['og:title'], 150), ogImage: meta['og:image'] || '', twitterCard: meta['twitter:card'] || '',
    themeColor: meta['theme-color'] || '', favicon: !!faviconEl, generator: meta['generator'] || '',
    hreflang: qa('link[rel="alternate"][hreflang]').length, jsonLd: Array.from(new Set(jsonLdTypes)).slice(0, 8)
  };

  // ── Estructura / SEO / accesibilidad
  const imgs = qa('img');
  const accName = (e) => txt(e.textContent) || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.getAttribute('title') || (q('img[alt]:not([alt=""])', e) ? 'x' : '');
  const links = qa('a[href]');
  let ext = 0, nofollow = 0;
  links.forEach(a => { try { if (new URL(a.href, L.href).hostname !== L.hostname && /^https?:/.test(a.href)) ext++; } catch (e) {} if (/nofollow/.test(a.rel)) nofollow++; });
  const inputs = qa('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=image]):not([type=reset]),select,textarea');
  const unlabeled = inputs.filter(i => !(i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || i.title || (i.id && q('label[for="' + CSS.escape(i.id) + '"]')) || i.closest('label'))).length;
  const head = D.head;
  const structure = {
    headings: [1, 2, 3, 4, 5, 6].map(n => qa('h' + n).length),
    images: imgs.length, imagesNoAlt: imgs.filter(i => !i.hasAttribute('alt')).length,
    imagesNoSize: imgs.filter(i => !(i.getAttribute('width') && i.getAttribute('height')) && !/[.]svg(\?|$)/i.test(i.src)).length,
    imagesLazy: imgs.filter(i => i.loading === 'lazy').length,
    links: links.length, linksExternal: ext, linksInternal: links.length - ext, linksNofollow: nofollow,
    linksNoText: links.filter(a => !accName(a)).length,
    buttonsNoName: qa('button,[role=button]').filter(b => !accName(b)).length,
    forms: qa('form').length, inputs: inputs.length, inputsUnlabeled: unlabeled,
    iframes: qa('iframe').length, scripts: qa('script').length, scriptsExternal: qa('script[src]').length,
    scriptsInline: qa('script:not([src])').length, stylesheets: qa('link[rel=stylesheet]').length,
    renderBlocking: head ? qa('script[src]:not([async]):not([defer]):not([type=module])', head).length : 0,
    domNodes: D.getElementsByTagName('*').length,
    words: D.body ? txt(D.body.innerText).split(' ').filter(Boolean).length : 0,
    hasMain: !!q('main,[role=main]'), zoomBlocked: /user-scalable\s*=\s*(no|0)/i.test(meta['viewport'] || '') || /maximum-scale\s*=\s*1(\.0)?(\s|,|$)/i.test(meta['viewport'] || '')
  };

  // ── Rendimiento y terceros
  const tp = {};
  const bytesBy = {};
  let total = 0, modernImg = 0, legacyImg = 0, withSize = 0;
  res.forEach(r => {
    total += r.s; if (r.s) withSize++;
    const ty = r.t === 'css' || /[.]css(\?|$)/i.test(r.u) ? 'css' : r.t === 'script' ? 'script' : r.t === 'img' ? 'img' : (/[.](woff2?|ttf|otf)(\?|$)/i.test(r.u) ? 'font' : 'otro');
    bytesBy[ty] = (bytesBy[ty] || 0) + r.s;
    if (/[.](webp|avif)(\?|$)/i.test(r.u)) modernImg++; else if (/[.](jpe?g|png|gif)(\?|$)/i.test(r.u)) legacyImg++;
    try {
      const h = new URL(r.u).hostname;
      if (base(h) !== myBase) { const o = tp[h] || (tp[h] = { h, n: 0, s: 0 }); o.n++; o.s += r.s; }
    } catch (e) {}
  });
  const perf = {
    ttfb: nav.responseStart ? Math.round(nav.responseStart) : null,
    dcl: nav.domContentLoadedEventEnd ? Math.round(nav.domContentLoadedEventEnd) : null,
    load: nav.loadEventEnd ? Math.round(nav.loadEventEnd) : null,
    fcp: fcpE ? Math.round(fcpE.startTime) : null, lcp,
    requests: res.length, bytes: total, bytesKnown: withSize, bytesBy,
    htmlBytes: nav.encodedBodySize || 0, protocol: proto,
    modernImg, legacyImg,
    thirdParty: Object.values(tp).sort((a, b) => b.n - a.n || b.s - a.s).slice(0, 40),
    thirdPartyHosts: Object.keys(tp).length, thirdPartyAll: Object.keys(tp).slice(0, 120),
    heaviest: res.slice().sort((a, b) => b.s - a.s).slice(0, 5).map(r => ({ u: r.u.slice(0, 160), s: r.s }))
  };

  const mixed = L.protocol === 'https:' ? urls.filter(u => /^http:\/\//i.test(u)).length : 0;
  let ls = 0; try { ls = localStorage.length; } catch (e) {}
  const security = {
    https: L.protocol === 'https:', mixed, headers: headers || {}, headersOk: !!headers, status, redirected,
    cookies: cookieNames.slice(0, 40), localStorageKeys: ls
  };

  // ── Privacidad y riesgos para el visitante (todo local; no se envía ningún valor)
  const pr = {};
  const nv = navigator;
  pr.visible = {
    ua: nv.userAgent, lang: (nv.languages || [nv.language]).join(', '), tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || ''),
    screen: screen.width + '×' + screen.height + ' @' + (W.devicePixelRatio || 1) + 'x', cores: nv.hardwareConcurrency || null, mem: nv.deviceMemory || null,
    platform: (nv.userAgentData && nv.userAgentData.platform) || nv.platform || '', touch: nv.maxTouchPoints || 0,
    dnt: nv.doNotTrack === '1', gpc: nv.globalPrivacyControl === true, online: nv.onLine
  };
  // Permisos ya concedidos a este sitio
  pr.permissions = {};
  await Promise.all(['geolocation', 'notifications', 'camera', 'microphone', 'clipboard-read', 'midi'].map(async n => {
    try { pr.permissions[n] = (await nv.permissions.query({ name: n })).state; } catch (e) {}
  }));
  // Almacenamiento local (solo nombres y tamaños)
  const kv = (st) => { try { return Object.keys(st).slice(0, 40).map(k => ({ k, n: (st.getItem(k) || '').length })); } catch (e) { return []; } };
  pr.local = kv(localStorage); pr.session = kv(sessionStorage);
  pr.localCount = (() => { try { return localStorage.length; } catch (e) { return 0; } })();
  pr.idb = [];
  try { if (indexedDB.databases) pr.idb = (await indexedDB.databases()).map(x => x.name).slice(0, 20); } catch (e) {}
  // Formularios: qué datos piden y adónde los envían
  const catOf = (i) => {
    const t = (i.type || '').toLowerCase(), ac = (i.getAttribute('autocomplete') || '').toLowerCase(), nm = ((i.name || '') + ' ' + (i.id || '') + ' ' + (i.placeholder || '')).toLowerCase();
    if (t === 'password') return 'contraseña';
    if (/cc-|card|cvv|cvc|tarjeta/.test(ac + nm)) return 'tarjeta de pago';
    if (/rut|dni|passport|pasaporte|ssn|cedula|c[eé]dula|nif/.test(nm)) return 'documento de identidad';
    if (t === 'email' || /email|correo|mail/.test(ac + nm)) return 'correo';
    if (t === 'tel' || /tel|phone|fono|celular|m[oó]vil/.test(ac + nm)) return 'teléfono';
    if (/address|direcci|street|postal|zip|comuna|ciudad/.test(ac + nm)) return 'dirección';
    if (/name|nombre|apellido/.test(ac + nm)) return 'nombre';
    if (t === 'file') return 'archivos';
    if (t === 'date' || /birth|nacimiento|fecha/.test(ac + nm)) return 'fecha';
    if (i.tagName === 'TEXTAREA') return 'texto libre';
    return '';
  };
  pr.forms = qa('form').slice(0, 12).map(fm => {
    let ah = L.hostname, ap = L.protocol;
    try { const u = new URL(fm.getAttribute('action') || L.href, L.href); ah = u.hostname; ap = u.protocol; } catch (e) {}
    const cats = Array.from(new Set(qa('input:not([type=hidden]):not([type=submit]):not([type=button]),textarea,select', fm).map(catOf).filter(Boolean)));
    return { host: ah, https: ap === 'https:', method: (fm.method || 'get').toLowerCase(), cats, pw: cats.includes('contraseña'), cross: base(ah) !== myBase };
  }).filter(f => f.cats.length);
  pr.passwordFields = qa('input[type=password]').length;
  // Iframes y scripts de terceros
  pr.iframes = qa('iframe[src]').slice(0, 40).map(f => { let h = ''; try { h = new URL(f.src, L.href).hostname; } catch (e) {} const r = f.getBoundingClientRect(); return { h, hidden: (r.width <= 5 || r.height <= 5 || getComputedStyle(f).display === 'none' || getComputedStyle(f).visibility === 'hidden'), cross: !!h && base(h) !== myBase }; }).filter(f => f.cross);
  const ts = qa('script[src]').filter(sc => { try { return base(new URL(sc.src).hostname) !== myBase; } catch (e) { return false; } });
  pr.thirdPartyScripts = ts.length; pr.noSri = ts.filter(sc => !sc.integrity).length;
  // Indicios de comportamiento en scripts legibles (inline + mismo origen)
  const texts = qa('script:not([src])').map(sc => sc.textContent || '').join('\n').slice(0, 500000);
  let same = '', unreadable = 0;
  const sameSrc = qa('script[src]').map(sc => sc.src).filter(u => { try { return new URL(u).origin === L.origin; } catch (e) { return false; } }).slice(0, 8);
  unreadable = ts.length;
  await Promise.all(sameSrc.map(async u => { try { const r = await fetch(u, { cache: 'force-cache' }); same += '\n' + (await r.text()).slice(0, 400000); } catch (e) {} }));
  const code = texts + same;
  const T = (re) => re.test(code);
  pr.signals = {
    canvasFp: T(/toDataURL/) && T(/fillText|measureText/) && T(/getContext\(\s*['"]2d/),
    webglFp: T(/WEBGL_debug_renderer_info|37446|UNMASKED_RENDERER/),
    audioFp: T(/OfflineAudioContext|createOscillator[\s\S]{0,300}getChannelData/),
    battery: T(/getBattery\s*\(/), devices: T(/enumerateDevices\s*\(/), webrtc: T(/RTCPeerConnection|webkitRTCPeerConnection/),
    clipboardRead: T(/clipboard\.readText|clipboardData\.getData/), geolocation: T(/geolocation\.(getCurrentPosition|watchPosition)/),
    notifyPrompt: T(/Notification\.requestPermission/),
    keylog: T(/addEventListener\(\s*['"](keydown|keypress|keyup)['"]/) && T(/sendBeacon|XMLHttpRequest|fetch\s*\(/),
    obfuscated: T(/eval\(\s*(atob|unescape|String\.fromCharCode)/) || T(/document\.write\(\s*unescape/) || T(/\\x[0-9a-f]{2}(\\x[0-9a-f]{2}){25,}/i),
    miner: T(/coinhive|cryptonight|coin-hive|minero\.cc|webminepool|CoinImp/i),
    scanned: Math.round(code.length / 1024), unreadable
  };
  pr.suspectHost = { punycode: /(^|[.])xn--/.test(L.hostname), ipHost: /^[0-9]+(\.[0-9]+){3}$/.test(L.hostname) || /^\[/.test(L.hostname), atInUrl: L.href.indexOf('@') > -1 && L.href.indexOf('@') < (L.href.indexOf(L.pathname) < 0 ? 9999 : L.href.indexOf(L.pathname)) };
  pr.cookieNames = cookieNames.slice(0, 60);
  pr.origin = L.origin;

  return {
    privacy: pr,
    ts: Date.now(), url: L.href, host: L.hostname, page, structure, perf, security,
    wp: { plugins: wpPlugins, themes: wpThemes },
    techs: Array.from(found.values()).sort((a, b) => a.c.localeCompare(b.c) || a.n.localeCompare(b.n))
  };
}
