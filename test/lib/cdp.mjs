/* Headless Chrome 驅動：只用 Node 內建（fetch、WebSocket、child_process）。
   跟 cli/pptgen.mjs 刻意分開，這裡多了 console/例外收集、視窗尺寸、下載與截圖。 */
import { spawn } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync, existsSync, writeSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const sleep = ms => new Promise(r => setTimeout(r, ms));
/* TEST_TRACE=1 會把啟動過程寫到 stderr，CI 上瀏覽器起不來時很好用 */
const tr = m => { if (process.env.TEST_TRACE) { try { writeSync(2, '   cdp: ' + m + '\n'); } catch { } } };

export function findBrowser() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const pf = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
  const list = process.platform === 'win32'
    ? pf.flatMap(p => [join(p, 'Google/Chrome/Application/chrome.exe'), join(p, 'Microsoft/Edge/Application/msedge.exe')])
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Chromium.app/Contents/MacOS/Chromium']
      : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'];
  return list.find(p => existsSync(p)) || null;
}

export async function launch({ downloadDir } = {}) {
  tr('launch start, dir=' + downloadDir);
  const exe = findBrowser();
  if (!exe) throw new Error('找不到 Chrome 或 Edge；請安裝，或用環境變數 CHROME_PATH 指定');
  const prof = mkdtempSync(join(tmpdir(), 'ppt-test-'));
  /* CI 的容器裡常要 --no-sandbox --disable-dev-shm-usage，用環境變數追加，不影響本機預設 */
  const extra = String(process.env.CHROME_FLAGS || '').split(/\s+/).filter(Boolean);
  tr('spawning ' + exe + (extra.length ? ' [' + extra.join(' ') + ']' : ''));
  const proc = spawn(exe, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-gpu',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--mute-audio',
    ...extra, 'about:blank'], { stdio: 'ignore' });
  let port = '';
  for (let i = 0; i < 120 && !port; i++) {
    await sleep(120);
    try { port = readFileSync(join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); } catch { }
  }
  tr('port=' + port);
  if (!port) { proc.kill(); throw new Error('瀏覽器沒有啟動（DevToolsActivePort 沒出現）'); }
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const target = tabs.find(t => t.type === 'page');
  if (!target) { proc.kill(); throw new Error('瀏覽器沒有可用分頁'); }
  tr('ws connecting');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('CDP WebSocket 連不上')); });

  let seq = 0;
  const pending = new Map();
  const logs = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); p(m); return; }
    if (m.method === 'Runtime.consoleAPICalled') {
      const type = m.params.type;
      if (type === 'error' || type === 'warning') logs.push({ kind: 'console.' + type, text: (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ') });
    } else if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails || {};
      logs.push({ kind: 'exception', text: (d.exception && d.exception.description) || d.text || 'unknown' });
    } else if (m.method === 'Log.entryAdded') {
      const e = m.params.entry || {};
      if (e.level === 'error') logs.push({ kind: 'log.' + (e.source || '?'), text: e.text || '' });
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, m => m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result));
    ws.send(JSON.stringify({ id, method, params }));
  });

  tr('ws open, enabling domains');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Page.setLifecycleEventsEnabled', { enabled: true });
  if (downloadDir) {
    try { await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir, eventsEnabled: true }); }
    catch { await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir }); }
  }

  tr('domains enabled');
  const close = () => {
    try { ws.close(); } catch { }
    try { proc.kill(); } catch { }
    setTimeout(() => { try { rmSync(prof, { recursive: true, force: true }); } catch { } }, 400);
  };
  return { send, logs, close, browser: exe };
}

/* 一個「頁面」：導覽、評估、視窗尺寸、截圖 */
export async function openPage(session, url, { width = 1720, height = 1200 } = {}) {
  const { send, logs } = session;
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  logs.length = 0;
  let mark = 0;
  const nav = await send('Page.navigate', { url });
  if (nav.errorText) throw new Error('導覽失敗：' + nav.errorText);

  const run = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, timeout: 300000 });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  for (let i = 0; i < 150; i++) {
    await sleep(100);
    try { if (await run(`document.readyState==='complete' && typeof renderSVG==='function' && typeof buildPptx==='function'`)) break; } catch { }
    if (i === 149) throw new Error('App 沒有載入完成');
  }
  await run('new Promise(r=>{const t0=Date.now();const f=()=>{if(document.fonts&&document.fonts.ready){document.fonts.ready.then(()=>setTimeout(r,60))}else setTimeout(r,60)};f()})');
  return {
    run,
    /* 每個測試前清掉，錯誤才不會被算到後面的測試上 */
    clearErrors: () => { mark = logs.length; },
    errors: () => logs.slice(mark),
    async viewport(w, h, mobile = w < 700) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
      await sleep(200);
    },
    async reload() {
      await send('Page.reload', { ignoreCache: true });
      for (let i = 0; i < 150; i++) {
        await sleep(100);
        try { if (await run(`document.readyState==='complete' && typeof renderSVG==='function'`)) return; } catch { }
      }
      throw new Error('重新載入後 App 沒起來');
    },
    async clearStorage() {
      await run(`(async()=>{try{localStorage.clear()}catch(e){}
        await new Promise(r=>{const q=indexedDB.deleteDatabase('layoutGen');q.onsuccess=r;q.onerror=r;q.onblocked=r;setTimeout(r,1500)});
        return 1})()`);
      await sleep(150);
    },
    async screenshot(path) {
      const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const { writeFileSync } = await import('node:fs');
      writeFileSync(path, Buffer.from(data, 'base64'));
    }
  };
}
