(async () => {
  const { lastScan } = await chrome.storage.local.get('lastScan');
  const doc = document.getElementById('doc');
  if (!lastScan) { doc.innerHTML = '<p>No hay un análisis reciente. Abre LINCEO DETECTOR sobre un sitio y vuelve a pulsar «Informe PDF».</p>'; return; }
  const { data: d, audit: a, dns, diff } = lastScan, c = a.counts, e = R.esc;
  document.title = 'Informe LINCEO DETECTOR - ' + d.host;
  doc.innerHTML = `<div class="cover"><small>Informe técnico del sitio</small><h1>${e(d.host)}</h1><p>${e(d.url)}</p><p>Analizado el ${new Date(d.ts).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' })} con LINCEO DETECTOR</p></div>
  ${R.scores(a)}
  <div class="sum"><div class="a"><b>${c.alta}</b><span>Prioridad alta</span></div><div class="m"><b>${c.media}</b><span>Prioridad media</span></div><div><b>${c.baja}</b><span>Prioridad baja</span></div><div><b>${a.headerGrade.grade}</b><span>Nota de headers</span></div></div>
  <h2>Resumen</h2>${R.summary(d, a, Analysis.privacyReport(d))}
  <h2>Seguridad y privacidad del visitante</h2>${R.privacy(d, Analysis.privacyReport(d), false)}
  <h2 id="cookies">Cookies a fondo</h2><div id="ckbox"><p class="muted">Chrome solo entrega las cookies HttpOnly, sus atributos y las de terceros a extensiones con permiso explícito. Este análisis es opcional y solo toca este sitio.</p><button id="ckgo" class="act noprint">Conceder permiso y analizar</button></div>
  <h2>Qué mejorar</h2>${R.issues(a)}
  <h2>Seguridad</h2>${R.security(d, a)}
  <h2>Tecnologías detectadas</h2>${R.stack(d)}
  <h2>Página</h2>${R.page(d)}
  <h2>Rendimiento y terceros</h2>${R.perf(d)}
  ${dns ? '<h2>DNS y correo</h2>' + R.dns(dns) : ''}
  ${diff ? '<h2>Cambios desde el análisis anterior</h2>' + R.changes(diff, 1) : ''}
  <footer>Generado localmente por LINCEO DETECTOR. Las detecciones son heurísticas: verificar antes de actuar.</footer>`;
  const ckgo = document.getElementById('ckgo');
  ckgo.onclick = async () => {
    const u = new URL(d.url), parts = u.hostname.split('.'), root = parts.length > 2 && parts[parts.length - 1].length === 2 && ['co', 'com', 'org', 'net', 'gov', 'edu', 'ac', 'gob'].includes(parts[parts.length - 2]) ? parts.slice(-3).join('.') : parts.slice(-2).join('.');
    try {
      const ok = await chrome.permissions.request({ permissions: ['cookies'], origins: ['*://*.' + root + '/*'] });
      if (!ok) { ckgo.textContent = 'Permiso denegado'; return; }
      const list = await chrome.cookies.getAll({ domain: root });
      document.getElementById('ckbox').innerHTML = R.cookiesDeep(Analysis.cookieAudit(list, u.hostname, u.protocol === 'https:'));
    } catch (e) { ckgo.textContent = 'No se pudo analizar: ' + e.message; }
  };
  if (location.hash === '#cookies') document.getElementById('cookies').scrollIntoView();
  document.getElementById('print').onclick = () => window.print();
})();
