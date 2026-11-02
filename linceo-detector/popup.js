(() => {
  const $ = (s) => document.querySelector(s);
  const TABS = [['summary', 'home', 'Resumen'], ['privacy', 'shield', 'Seguridad'], ['stack', 'layers', 'Stack'], ['audit', 'check', 'Auditoría'], ['page', 'file', 'Página'], ['perf', 'gauge', 'Rendimiento'], ['dns', 'globe', 'DNS'], ['changes', 'clock', 'Cambios'], ['compare', 'layers', 'Comparar']];
  let S = { tab: 'summary', series: [], area: '', dns: null, data: null, audit: null, diff: null, hist: 0 };

  const histKey = (h) => 'hist:' + h;
  async function loadHist(host) { try { return (await chrome.storage.local.get(histKey(host)))[histKey(host)] || []; } catch (e) { return []; } }
  async function saveHist(host, snap) {
    try {
      const h = await loadHist(host);
      const prev = h[h.length - 1];
      S.diff = Analysis.diff(prev, snap); S.hist = h.length;
      S.series = h.map(x => x.overall).concat(!prev || Date.now() - prev.t > 60000 ? [snap.overall] : []).slice(-15);
      if (prev && Date.now() - prev.t <= 60000) S.series[S.series.length - 1] = snap.overall;
      if (!prev || Date.now() - prev.t > 60000) h.push(snap); else h[h.length - 1] = snap;
      const all = await chrome.storage.local.get(null);
      const keys = Object.keys(all).filter(k => k.startsWith('hist:'));
      if (keys.length > 60) { const old = keys.map(k => [k, all[k][all[k].length - 1].t]).sort((a, b) => a[1] - b[1])[0][0]; if (old !== histKey(host)) await chrome.storage.local.remove(old); }
      await chrome.storage.local.set({ [histKey(host)]: h.slice(-15) });
    } catch (e) { /* sin historial */ }
  }

  async function scan() {
    $('#state').hidden = false; $('#main').hidden = true; $('#state').textContent = 'Analizando…';
    ['#pdf', '#json', '#md'].forEach(s => $(s).disabled = true);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/^https?:/.test(tab.url || '')) { $('#state').textContent = 'Esta página no se puede analizar (página interna del navegador o Chrome Web Store).'; $('#host').textContent = ''; return; }
    $('#host').textContent = tab.url;
    try {
      const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', func: scanPage, args: [SIGNATURES] });
      if (!r || !r.result) throw new Error('sin resultado');
      S.data = r.result; S.audit = Analysis.audit(S.data); S.dns = null;
      await saveHist(S.data.host, Analysis.snapshot(S.data, S.audit));
      await chrome.storage.local.set({ lastScan: { data: S.data, audit: S.audit, dns: S.dns, diff: S.diff } });
      $('#state').hidden = true; $('#main').hidden = false; ['#pdf', '#json', '#md'].forEach(s => $(s).disabled = false);
      $('#scores').innerHTML = R.scores(S.audit); draw();
    } catch (e) { $('#state').hidden = false; $('#state').textContent = 'Error al analizar la página: ' + (e && e.message ? e.message : e); }
  }

  function draw() {
    $('#tabs').innerHTML = TABS.map(([k, ic, l]) => `<button data-t="${k}" class="${k === S.tab ? 'on' : ''}">${R.icon(ic)}<span>${l}</span></button>`).join('');
    $('#filter').hidden = S.tab !== 'stack'; const sel = $('#area'); sel.hidden = S.tab !== 'audit';
    if (!sel.options.length) { sel.innerHTML = '<option value="">Todas las áreas</option>' + Object.entries(Analysis.AREAS).map(([k, v]) => `<option value="${k}">${v}</option>`).join(''); }
    const d = S.data, a = S.audit, v = $('#view');
    if (S.tab === 'summary') v.innerHTML = R.summary(d, a, Analysis.privacyReport(d));
    else if (S.tab === 'privacy') v.innerHTML = R.privacy(d, Analysis.privacyReport(d), true) + '<div class="todo"><div><b>Análisis profundo de cookies</b><p>Muestra HttpOnly, Secure, SameSite y duración, incluidas las que JavaScript no ve. Pide un permiso opcional de Chrome solo para este sitio.</p></div><button data-act="cookies" class="act">Analizar cookies</button></div>';
    else if (S.tab === 'stack') v.innerHTML = R.stack(d);
    else if (S.tab === 'audit') v.innerHTML = (S.area ? '' : R.security(d, a)) + R.issues(a, S.area);
    else if (S.tab === 'page') v.innerHTML = R.page(d);
    else if (S.tab === 'perf') v.innerHTML = R.perf(d);
    else if (S.tab === 'dns') { v.innerHTML = '<button id="dnsgo" class="dnsbtn">' + (S.dns ? 'Reconsultar DNS' : 'Consultar DNS') + '</button>' + R.dns(S.dns); $('#dnsgo').onclick = runDns; }
    else if (S.tab === 'compare') { drawCompare(); return; }
    else if (S.tab === 'changes') v.innerHTML = R.changes(S.diff, S.hist + 1, S.series);
    applyFilter();
  }
  async function drawCompare() {
    const all = await chrome.storage.local.get(null);
    const hosts = Object.keys(all).filter(k => k.startsWith('hist:') && all[k].length).map(k => k.slice(5)).sort();
    const v = $('#view');
    if (hosts.length < 2) { v.innerHTML = '<p class="empty">Analiza al menos dos sitios distintos para compararlos. Cada análisis queda guardado localmente (' + hosts.length + ' hasta ahora).</p>'; return; }
    const A = S.cmpA && hosts.includes(S.cmpA) ? S.cmpA : (hosts.includes(S.data.host) ? S.data.host : hosts[0]);
    const B = S.cmpB && hosts.includes(S.cmpB) && S.cmpB !== A ? S.cmpB : hosts.find(h => h !== A);
    S.cmpA = A; S.cmpB = B;
    const opt = (sel) => hosts.map(h => `<option ${h === sel ? 'selected' : ''}>${R.esc(h)}</option>`).join('');
    const last = (h) => all['hist:' + h][all['hist:' + h].length - 1];
    v.innerHTML = `<div class="pick"><select id="cA">${opt(A)}</select><b>vs</b><select id="cB">${opt(B)}</select></div>` + R.compare(A, B, Analysis.compare(last(A), last(B)));
    $('#cA').onchange = (e) => { S.cmpA = e.target.value; drawCompare(); };
    $('#cB').onchange = (e) => { S.cmpB = e.target.value; drawCompare(); };
  }
  function applyFilter() {
    const f = $('#filter').value.trim().toLowerCase();
    document.querySelectorAll('.tech').forEach(e => { e.style.display = !f || e.dataset.q.includes(f) ? '' : 'none'; });
    document.querySelectorAll('.card').forEach(c => { c.style.display = [...c.querySelectorAll('.tech')].some(t => t.style.display !== 'none') ? '' : 'none'; });
  }
  async function runDns() {
    const b = $('#dnsgo'); b.disabled = true; b.textContent = 'Consultando…';
    try { S.dns = await DNS.lookup(S.data.host); await chrome.storage.local.set({ lastScan: { data: S.data, audit: S.audit, dns: S.dns, diff: S.diff } }); }
    catch (e) { $('#view').insertAdjacentHTML('beforeend', '<p class="bad">No se pudo consultar el DNS: ' + R.esc(e.message) + '</p>'); b.disabled = false; b.textContent = 'Consultar DNS'; return; }
    draw();
  }
  const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const flash = (el, t) => { const o = el.textContent; el.textContent = t; setTimeout(() => el.textContent = o, 1200); };

  const ACT = { site: () => 'chrome://settings/content/siteDetails?site=' + encodeURIComponent(S.data.privacy.origin), blocker: () => 'https://ublockorigin.com/', cookies: () => chrome.runtime.getURL('report.html') + '#cookies', cookies3: () => 'chrome://settings/cookies' };
  $('#view').onclick = (e) => { const b = e.target.closest('[data-act]'); const a = b && b.dataset.act; if (a && ACT[a]) chrome.tabs.create({ url: ACT[a]() }); };
  $('#tabs').onclick = (e) => { const b = e.target.closest('button[data-t]'); if (b) { S.tab = b.dataset.t; draw(); } };
  $('#filter').oninput = applyFilter;
  $('#area').onchange = (e) => { S.area = e.target.value; draw(); };
  $('#rescan').onclick = scan;
  $('#pdf').onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL('report.html') });
  $('#json').onclick = async (e) => { const out = { ...S.data, audit: { scores: S.audit.scores, overall: S.audit.overall, headerGrade: S.audit.headerGrade.grade, issues: S.audit.issues }, dns: S.dns }; try { await navigator.clipboard.writeText(JSON.stringify(out, null, 2)); flash(e.target, '¡Copiado!'); } catch (x) { download('linceo-detector-' + S.data.host + '.json', JSON.stringify(out, null, 2), 'application/json'); } };
  $('#md').onclick = () => download('linceo-detector-' + S.data.host + '.md', Analysis.markdown(S.data, S.audit, S.dns), 'text/markdown');
  $('#clear').onclick = async (e) => { e.preventDefault(); const all = await chrome.storage.local.get(null); await chrome.storage.local.remove(Object.keys(all).filter(k => k.startsWith('hist:'))); S.diff = null; S.hist = 0; flash(e.target, 'Historial borrado'); if (S.data) draw(); };
  scan();
})();
