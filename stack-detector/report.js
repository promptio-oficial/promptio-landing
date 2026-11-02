(async () => {
  const { lastScan } = await chrome.storage.local.get('lastScan');
  const doc = document.getElementById('doc');
  if (!lastScan) { doc.innerHTML = '<p>No hay un análisis reciente. Abre StackLens sobre un sitio y vuelve a pulsar «Informe PDF».</p>'; return; }
  const { data: d, audit: a, dns, diff } = lastScan, c = a.counts, e = R.esc;
  document.title = 'Informe StackLens - ' + d.host;
  doc.innerHTML = `<div class="cover"><small>Informe técnico del sitio</small><h1>${e(d.host)}</h1><p>${e(d.url)}</p><p>Analizado el ${new Date(d.ts).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' })} con StackLens</p></div>
  ${R.scores(a)}
  <div class="sum"><div class="a"><b>${c.alta}</b><span>Prioridad alta</span></div><div class="m"><b>${c.media}</b><span>Prioridad media</span></div><div><b>${c.baja}</b><span>Prioridad baja</span></div><div><b>${a.headerGrade.grade}</b><span>Nota de headers</span></div></div>
  <h2>Seguridad y privacidad del visitante</h2>${R.privacy(d, Analysis.privacyReport(d), false)}
  <h2>Qué mejorar</h2>${R.issues(a)}
  <h2>Seguridad</h2>${R.security(d, a)}
  <h2>Tecnologías detectadas</h2>${R.stack(d)}
  <h2>Página</h2>${R.page(d)}
  <h2>Rendimiento y terceros</h2>${R.perf(d)}
  ${dns ? '<h2>DNS y correo</h2>' + R.dns(dns) : ''}
  ${diff ? '<h2>Cambios desde el análisis anterior</h2>' + R.changes(diff, 1) : ''}
  <footer>Generado localmente por StackLens. Las detecciones son heurísticas: verificar antes de actuar.</footer>`;
  document.getElementById('print').onclick = () => window.print();
})();
