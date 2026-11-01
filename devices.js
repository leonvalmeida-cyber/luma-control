/* Device provider contract: listDevices() -> [{id, name, capabilities, state}],
   setPower(id, boolean). No DOM, persistence, or audio dependencies. */
(function (root) {
  'use strict';
  function createHueProvider({ bridgeIp, applicationKey, fetchImpl = globalThis.fetch }) {
    const parts = bridgeIp.split('.');
    if (parts.length !== 4 || parts.some(p => !/^\d{1,3}$/.test(p) || Number(p) > 255))
      throw Error('Bitte eine lokale IPv4-Adresse eingeben.');
    const [a, b] = parts.map(Number);
    if (!(a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)))
      throw Error('Nur private Bridge-Adressen im Heimnetz sind erlaubt.');
    if (!applicationKey?.trim()) throw Error('Bitte deinen Application Key eingeben.');
    const origin = 'https://' + parts.map(Number).join('.');
    const knownIds = new Map();
    async function request(method, path, body) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      try {
        const response = await fetchImpl(origin + '/clip/v2/resource/light' + path, {
          method, mode: 'cors', credentials: 'omit', cache: 'no-store', redirect: 'error',
          headers: { 'hue-application-key': applicationKey.trim(),
            ...(body ? { 'Content-Type': 'application/json' } : {}) },
          ...(body ? { body: JSON.stringify(body) } : {}), signal: controller.signal
        });
        if (!response.ok) throw Error('Hue-Anfrage abgelehnt (HTTP ' + response.status + ').');
        let result;
        try { result = await response.json(); } catch { throw Error('Ungültige Hue-Antwort.'); }
        if (!result || !Array.isArray(result.errors) || !Array.isArray(result.data))
          throw Error('Ungültige Hue-Antwort.');
        // Do not display raw bridge errors: these can contain request details.
        if (result.errors.length) throw Error('Hue meldet einen Fehler. Bitte Berechtigung und Lampe prüfen.');
        return result.data;
      } finally { clearTimeout(timer); }
    }
    return {
      async listDevices() {
        knownIds.clear();
        const lights = await request('GET', '');
        return lights.filter(l => l && typeof l.id === 'string' && l.type === 'light').map(l => {
          const id = 'hue:' + l.id;
          knownIds.set(id, l.id);
          return { id, name: l.metadata?.name || 'Lampe',
            capabilities: { power: typeof l.on?.on === 'boolean' },
            state: { on: l.on?.on } };
        });
      },
      async setPower(id, on) {
        if (!knownIds.has(id) || typeof on !== 'boolean') throw Error('Ungültiger Schaltbefehl.');
        await request('PUT', '/' + encodeURIComponent(knownIds.get(id)), { on: { on } });
      }
    };
  }
  root.LumaDevices = { createHueProvider };
})(globalThis);
