// Renders tools/og/og.html for each department into assets/og/og-<name>.jpg (1200×630).
//   node tools/og/shoot.mjs
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const here = import.meta.dirname, port = 9500 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/og-${port}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
let t; for (let i = 0; i < 100 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(150); } }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let seq = 0; const pend = new Map(), ev = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); p.res(m.result); } else ev.forEach(f => f(m)); };
const send = (method, params = {}) => new Promise(res => { const id = ++seq; pend.set(id, { res }); ws.send(JSON.stringify({ id, method, params })); });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
for (const d of ['print', 'tech', 'brand', 'event']) {
  const loaded = new Promise(r => { const f = m => { if (m.method === 'Page.loadEventFired') { ev.splice(ev.indexOf(f), 1); r(); } }; ev.push(f); });
  await send('Page.navigate', { url: `file://${resolve(here, 'og.html')}?d=${d}` }); await loaded;
  await send('Runtime.evaluate', { expression: 'window.READY', awaitPromise: true }); await sleep(200);
  const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86 });
  writeFileSync(resolve(here, `../../assets/og/og-${d}.jpg`), Buffer.from(data, 'base64')); console.log('og-' + d + '.jpg');
}
ws.close(); chrome.kill();
