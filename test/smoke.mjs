/* 上線煙霧測試：用真實網址檢查 GitHub Pages 到底送出了什麼。
   這支抓的是「本機過、線上壞」——CI 的測試只驗 repo 裡的檔案，驗不到服務出來的東西。

   用法：
     node test/smoke.mjs https://cormort.github.io/ppt-layout-generator/

   檢查：
     1. 線上的 index.html 與 repo 裡的內容一致（逐字元，CRLF 正規化後）
     2. 線上 sw.js 的 VERSION 與 repo 一致（抓「版本沒更新／舊快取」）
     3. manifest.webmanifest 回 200、是合法 JSON、有 icons
     4. 用 headless Chrome 開真的網址：App 起得來、版型數量與 repo 一致、沒有 console 錯誤 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, openPage } from './lib/cdp.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] || 'https://cormort.github.io/ppt-layout-generator/').replace(/\/?$/, '/');
const lf = s => s.replace(/\r\n/g, '\n');

let pass = 0, fail = 0;
const ok = (cond, name, detail = '') => {
  if (cond) { pass++; console.log(`ok   ${name}${detail ? '  ' + detail : ''}`); }
  else { fail++; console.log(`FAIL ${name}${detail ? '  ' + detail : ''}`); }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const localHtml = lf(readFileSync(join(root, 'index.html'), 'utf8'));
const localSw = readFileSync(join(root, 'sw.js'), 'utf8');
const localVersion = (localSw.match(/const VERSION = '([^']+)'/) || [, ''])[1];
const expectTpl = (localHtml.match(/^def\(\{id:'/gm) || []).length;

const get = async (path, tries = 1) => {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(base + path + (path.includes('?') ? '&' : '?') + 'smoke=' + Date.now(), { cache: 'no-store', redirect: 'follow' });
      return { res, body: await res.text() };
    } catch (e) { last = e; await sleep(3000); }
  }
  throw last;
};

console.log(`target: ${base}`);
console.log(`repo  : ${expectTpl} 個版型, sw ${localVersion}, ${localHtml.length} 字元\n`);

/* ---- 1. HTML 內容一致（Pages 傳播可能要幾十秒，最多等 90 秒）---- */
let htmlOk = false, htmlNote = '';
for (let i = 0; i < 18; i++) {
  const { res, body } = await get('index.html', 3);
  const remote = lf(body);
  if (res.status === 200 && remote === localHtml) { htmlOk = true; htmlNote = `${remote.length} 字元`; break; }
  htmlNote = `HTTP ${res.status}, 線上 ${remote.length} 字元 vs repo ${localHtml.length}`;
  await sleep(5000);
}
ok(htmlOk, '線上 index.html 與 repo 完全一致', htmlNote);

/* ---- 2. service worker 版本 ---- */
{
  const { res, body } = await get('sw.js', 3);
  const v = (body.match(/const VERSION = '([^']+)'/) || [, ''])[1];
  ok(res.status === 200 && v === localVersion, '線上 sw.js 版本與 repo 一致', `HTTP ${res.status}, ${v || '找不到 VERSION'}`);
  ok(/javascript/i.test(res.headers.get('content-type') || ''), 'sw.js 的 content-type 正確', res.headers.get('content-type') || '(空)');
}

/* ---- 3. manifest ---- */
{
  const { res, body } = await get('manifest.webmanifest', 3);
  let json = null;
  try { json = JSON.parse(body); } catch { }
  ok(res.status === 200 && json && Array.isArray(json.icons) && json.icons.length > 0,
    'manifest.webmanifest 可用', `HTTP ${res.status}, icons ${json && json.icons ? json.icons.length : '?'}`);
  if (json && json.icons) {
    for (const icon of json.icons) {
      const { res: r } = await get(icon.src.replace(/^\.?\//, ''), 2);
      ok(r.status === 200, `manifest 圖示存在：${icon.src}`, `HTTP ${r.status}`);
    }
  }
}

/* ---- 4. 真的用瀏覽器開一次 ---- */
let session;
try {
  session = await launch({});
  const page = await openPage(session, base);
  const info = await page.run(`(()=>({
    tpl: TPL.length,
    ready: document.readyState,
    hasLib: !!document.getElementById('lib'),
    hasStage: !!document.getElementById('stage'),
    version: (window.S && S.ratio) || null
  }))()`);
  ok(info.tpl === expectTpl, '線上的版型數量與 repo 一致', `${info.tpl} vs ${expectTpl}`);
  ok(info.hasLib && info.hasStage, '主要介面元素都在', 'lib/stage');
  ok(page.errors().length === 0, '開起來沒有 console 錯誤或例外',
    page.errors().slice(0, 3).map(e => e.text.split('\n')[0]).join(' / '));
} catch (e) {
  ok(false, '用瀏覽器開線上網址', String(e && e.message || e).split('\n')[0]);
} finally {
  if (session) session.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
