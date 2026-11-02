/* Consulta DNS por DoH (Cloudflare, con Google como respaldo). Solo se envía el dominio, y solo al pulsar el botón. */
const DNS = (() => {
  const TYPES = { A: 1, AAAA: 28, NS: 2, MX: 15, TXT: 16, CAA: 257 };
  async function q(name, type) {
    const eps = ['https://cloudflare-dns.com/dns-query', 'https://dns.google/resolve'];
    for (const ep of eps) {
      try {
        const r = await fetch(`${ep}?name=${encodeURIComponent(name)}&type=${type}`, { headers: { accept: 'application/dns-json' } });
        if (!r.ok) continue;
        const j = await r.json();
        return (j.Answer || []).filter(a => a.type === TYPES[type]).map(a => a.data);
      } catch (e) { /* siguiente */ }
    }
    return null;
  }
  const rootOf = (h) => {
    const p = h.split('.');
    if (p.length <= 2) return h;
    const second = p[p.length - 2], tld = p[p.length - 1];
    return (tld.length === 2 && ['co', 'com', 'org', 'net', 'gov', 'edu', 'ac', 'gob'].includes(second)) ? p.slice(-3).join('.') : p.slice(-2).join('.');
  };
  async function dnssec(domain) {
    for (const ep of ['https://cloudflare-dns.com/dns-query']) {
      try { const r = await fetch(`${ep}?name=${encodeURIComponent(domain)}&type=A&do=1`, { headers: { accept: 'application/dns-json' } }); if (r.ok) return !!(await r.json()).AD; } catch (e) {}
    }
    return null;
  }
  // Edad y registrador del dominio vía RDAP (opcional; solo el dominio se envía a rdap.org)
  async function rdap(domain) {
    try {
      const r = await fetch('https://rdap.org/domain/' + encodeURIComponent(domain), { headers: { accept: 'application/rdap+json' } });
      if (!r.ok) return null;
      const j = await r.json();
      const ev = (a) => ((j.events || []).find(e => e.eventAction === a) || {}).eventDate || '';
      const ent = (j.entities || []).find(e => (e.roles || []).includes('registrar'));
      const fn = ent && ent.vcardArray && (ent.vcardArray[1] || []).find(x => x[0] === 'fn');
      const reg = ev('registration'), exp = ev('expiration');
      return { registered: reg, expires: exp, registrar: fn ? fn[3] : '', ageDays: reg ? Math.floor((Date.now() - Date.parse(reg)) / 86400000) : null,
        daysLeft: exp ? Math.floor((Date.parse(exp) - Date.now()) / 86400000) : null };
    } catch (e) { return null; }
  }
  async function lookup(host) {
    const domain = rootOf(host.replace(/^www[.]/, ''));
    const keys = Object.keys(TYPES);
    const vals = await Promise.all([...keys.map(k => q(domain, k)), q('_dmarc.' + domain, 'TXT'), q('_mta-sts.' + domain, 'TXT')]);
    const [sec, rd] = await Promise.all([dnssec(domain), rdap(domain)]);
    if (vals.every(v => v === null)) throw new Error('sin respuesta DNS');
    const r = {}; keys.forEach((k, i) => r[k] = vals[i] || []); r.DMARC = vals[keys.length] || []; r.MTASTS = vals[keys.length + 1] || []; r.dnssec = sec;
    const s = Analysis.dnsSummary(r);
    if (rd && rd.ageDays != null) { if (rd.ageDays < 30) s.issues.unshift(['alta', `Dominio registrado hace solo ${rd.ageDays} días`, 'Los dominios muy nuevos son típicos del phishing. Verificar.', 'No ingreses datos personales hasta confirmar que es el sitio oficial.']); else if (rd.ageDays < 180) s.issues.unshift(['media', `Dominio joven: ${rd.ageDays} días`, '', 'Verifica la reputación antes de comprar o registrarte.']); }
    if (rd && rd.daysLeft != null && rd.daysLeft < 30) s.issues.push(['baja', `El dominio vence en ${rd.daysLeft} días`, '', 'Renovar para evitar perder el sitio.']);
    return { domain, records: r, s, rdap: rd };
  }
  return { lookup };
})();
