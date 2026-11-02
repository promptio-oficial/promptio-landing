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
  async function lookup(host) {
    const domain = rootOf(host.replace(/^www[.]/, ''));
    const keys = Object.keys(TYPES);
    const vals = await Promise.all([...keys.map(k => q(domain, k)), q('_dmarc.' + domain, 'TXT')]);
    if (vals.every(v => v === null)) throw new Error('sin respuesta DNS');
    const r = {}; keys.forEach((k, i) => r[k] = vals[i] || []); r.DMARC = vals[keys.length] || [];
    return { domain, records: r, s: Analysis.dnsSummary(r) };
  }
  return { lookup };
})();
