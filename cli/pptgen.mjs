#!/usr/bin/env node
/* 排版產生器命令列版：在背景（headless）Chrome／Edge 開啟 index.html，
   用 Markdown 大綱產生含逐字稿的 PPTX，並回報哪幾頁文字放不下。
   跟網頁版共用同一份程式，排版結果完全相同。需要 Node 22 以上（內建 WebSocket）。 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HELP = `排版產生器 CLI — Markdown 大綱 → 含逐字稿的 PPTX

用法：
  node pptgen.mjs build <大綱.md> [-o 簡報.pptx] [選項]   產生 PPTX，並回報放不下的頁
  node pptgen.mjs check <大綱.md> [選項]                  只檢查（不產生檔案），快
  node pptgen.mjs preview <大綱.md> --pages 3,7 [-d 資料夾] 輸出指定頁的 PNG 預覽
  node pptgen.mjs from-pptx <簡報.pptx> [-o 大綱.md]       把既有 PPTX 轉成大綱（含逐字稿），方便 AI 讀與改
  node pptgen.mjs templates                               列出所有版型與容量
  （build／check／preview 也可以直接吃 .pptx：重新排版既有簡報，照片會一起帶過來）
  node pptgen.mjs example                                 印出大綱範例
  node pptgen.mjs install-skill [資料夾]                   安裝 Claude Skill（預設 ~/.claude/skills）

選項：
  -o, --out <檔案>       PPTX 輸出路徑（預設：大綱檔名.pptx）
  -d, --dir <資料夾>     preview 的 PNG 輸出資料夾（預設：大綱檔名_預覽）
  --pages <清單>         preview 要輸出的頁碼，例如 1,3,5-8；all＝全部
  --project <檔案>       另存成網頁版可載入的專案檔（.pptgen.json），可在網頁上微調
  --palette <名稱>       商務配色：藏青金、商務藍、深灰橘、墨綠米、酒紅灰、科技紫
  --color <#hex>         主色；--accent <#hex> 輔色；--bg <#hex> 底色
  --font <名稱>          標題字體（例如 標楷體）；--body-font <名稱> 內文字體
  --scale <70-140>       全域字級（%）
  --text <模式>          PPTX 文字：edit＝可修改・逐行（預設，外觀最接近）、flow＝可修改・整段（改字會自動重排）、
                         image＝轉成圖片（外觀完全一致，但不能改字）
  --quality small        PPTX 底圖用 1 倍（檔案約小一半）；預設 std＝2 倍
  --no-images            輸入是 .pptx 時不帶入原簡報的照片
  --json                 以 JSON 輸出結果（給程式讀）
  --app <路徑或網址>      指定 index.html（預設：本工具旁邊的 index.html）

結束代碼：0＝成功（可能有容量提醒）、1＝錯誤。
瀏覽器：自動尋找 Chrome／Edge；也可用環境變數 CHROME_PATH 指定。`;

const EXAMPLE = `<!-- 版型: 封面 -->
# 簡報標題
## 副標題
主講人｜單位
> 封面的逐字稿：各位好，今天要分享……

---
數字: 01
# 第一章　背景
## 為什麼要做這件事
> 章節頁的逐字稿

---
# 三個重點
## 一句話說明這一頁
- 重點一|補充說明
- 重點二|補充說明
- 重點三|補充說明
> 這一頁要講的內容……

---
# 驗收指標
| 指標 | 目標 | 說明 |
|---|---|---|
| 正確率 | 100% | 與人工結果逐筆核對 |
| 時間 | 2天→30分鐘 | 含人工檢查 |

---
<!-- 版型: 引言 -->
# 問對問題，才能找到答案
## 結語
`;

/* ---------- 參數 ---------- */
const argv = process.argv.slice(2);
const flags = {}, pos = [];
const ALIAS = { o: 'out', d: 'dir', h: 'help' };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i], m = a.match(/^--?([^=]+)(?:=(.*))?$/);
  if (!m || /^-\d/.test(a)) { pos.push(a); continue; }
  const k = ALIAS[m[1]] || m[1];
  if (m[2] !== undefined) flags[k] = m[2];
  else if (['json', 'help', 'no-images'].includes(k)) flags[k] = true;
  else flags[k] = argv[++i];
}
const [cmd, input] = pos;
const out = (s) => process.stdout.write(s + '\n');
const fail = (s) => { process.stderr.write('錯誤：' + s + '\n'); process.exit(1); };

if (!cmd || flags.help || cmd === 'help') { out(HELP); process.exit(0); }
if (cmd === 'example') { out(EXAMPLE); process.exit(0); }
if (cmd === 'install-skill') {
  /* 把 skill/SKILL.md 複製到 Claude 的 skills 資料夾，並填入這支 CLI 的絕對路徑 */
  const self = fileURLToPath(import.meta.url).replace(/\\/g, '/');
  const src = join(dirname(fileURLToPath(import.meta.url)), '..', 'skill', 'SKILL.md');
  if (!existsSync(src)) fail(`找不到 ${src}`);
  const dir = join(input ? resolve(input) : join(homedir(), '.claude', 'skills'), 'ppt-outline-deck');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'SKILL.md'), readFileSync(src, 'utf8').replaceAll('{{PPTGEN}}', self));
  out(`已安裝 Skill：${join(dir, 'SKILL.md')}\n重新開啟 Claude Code 後，說「把這份講稿做成簡報」就會使用。`);
  process.exit(0);
}
if (!['build', 'check', 'preview', 'templates', 'from-pptx', 'install-skill'].includes(cmd)) fail(`不認得的指令「${cmd}」；用 --help 看說明`);
if (cmd !== 'templates' && !input) fail('請指定大綱檔或 PPTX，例如：node pptgen.mjs build 大綱.md');
if (typeof WebSocket !== 'function') fail(`需要 Node 22 以上（目前 ${process.version}）`);

if (input && !existsSync(input)) fail(`找不到檔案：${input}`);
const isPptx = !!input && /\.pptx$/i.test(input);
if (cmd === 'from-pptx' && !isPptx) fail('from-pptx 要給 .pptx 檔');
const md = cmd === 'templates' || isPptx ? '' : readFileSync(input, 'utf8').replace(/^﻿/, '');
const pptxB64 = isPptx ? readFileSync(input).toString('base64') : '';
const stem = input ? input.replace(/\.(md|markdown|txt|pptx)$/i, '') : '';
const here = dirname(fileURLToPath(import.meta.url));
const appUrl = flags.app ? (/^https?:|^file:/.test(flags.app) ? flags.app : pathToFileURL(resolve(flags.app)).href) : pathToFileURL(join(here, '..', 'index.html')).href;

/* 「1,3,5-8」→ [1,3,5,6,7,8] */
function pageList(spec, n) {
  if (!spec || spec === 'all') return [...Array(n)].map((_, i) => i + 1);
  const set = new Set();
  for (const part of String(spec).split(',')) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) fail(`頁碼格式不對：${part}`);
    for (let i = +m[1]; i <= +(m[2] || m[1]); i++) if (i >= 1 && i <= n) set.add(i);
  }
  return [...set].sort((a, b) => a - b);
}

/* ---------- 瀏覽器 ---------- */
function findBrowser() {
  const env = process.env.CHROME_PATH;
  if (env && existsSync(env)) return env;
  const pf = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
  const list = process.platform === 'win32'
    ? pf.flatMap(p => [join(p, 'Google/Chrome/Application/chrome.exe'), join(p, 'Microsoft/Edge/Application/msedge.exe')])
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Chromium.app/Contents/MacOS/Chromium']
      : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'];
  return list.find(p => existsSync(p)) || fail('找不到 Chrome 或 Edge；請安裝，或用環境變數 CHROME_PATH 指定瀏覽器路徑');
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function openApp() {
  const prof = mkdtempSync(join(tmpdir(), 'pptgen-'));
  const proc = spawn(findBrowser(), ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
  let port;
  for (let i = 0; i < 80 && !port; i++) {
    await sleep(150);
    try { port = readFileSync(join(prof, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); } catch { }
  }
  if (!port) { proc.kill(); fail('瀏覽器沒有啟動'); }
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const run = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, timeout: 900000 });
    if (r.error) throw new Error(r.error.message);
    if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result.result.value;
  };
  const close = () => {
    try { ws.close(); } catch { }
    proc.kill();
    setTimeout(() => { try { rmSync(prof, { recursive: true, force: true }); } catch { } }, 300);
  };
  await send('Page.navigate', { url: appUrl });
  for (let i = 0; i < 100; i++) {
    await sleep(100);
    try { if (await run(`document.readyState==='complete'&&typeof importOutline==='function'&&typeof buildPptx==='function'`)) return { run, close }; } catch { }
  }
  close(); fail(`工具載入失敗：${appUrl}`);
}

/* 瀏覽器端：Uint8Array → base64 */
const B64 = 'u=>{let s="";for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode(...u.subarray(i,i+32768));return btoa(s)}';

/* ---------- 主流程 ---------- */
const app = await openApp();
try {
  if (cmd === 'templates') {
    const r = JSON.parse(await app.run(`JSON.stringify({cats:CATS,tpls:TPL.map(t=>({id:t.id,cat:t.cat,name:t.name,hint:t.hint})),alias:TPL_ALIAS,palettes:BIZ.map(b=>b[0]),fonts:FONTS.map(f=>f[0])})`));
    if (flags.json) out(JSON.stringify(r, null, 1));
    else {
      for (const [c, cn] of r.cats) {
        if (c === 'all') continue;
        out(`\n【${cn}】`);
        for (const t of r.tpls.filter(t => t.cat === c)) out(`  ${t.id.padEnd(10)} ${t.name} — ${t.hint}`);
      }
      out(`\n版型別名：${Object.entries(r.alias).map(([k, v]) => `${k}=${v}`).join('、')}`);
      out(`商務配色：${r.palettes.join('、')}`);
      out(`字體：${r.fonts.join('、')}`);
    }
  } else {
    /* 樣式設定：先洗過 sanitise，不合法的值會被擋掉 */
    const style = {};
    if (flags.palette) style.palette = flags.palette;
    for (const k of ['color', 'accent', 'bg']) if (flags[k]) style[k] = flags[k];
    if (flags.font) style.font = flags.font;
    if (flags['body-font']) style.bodyFont = flags['body-font'];
    if (flags.scale) style.fs = +flags.scale;
    if (flags.text && !['edit', 'flow', 'image'].includes(flags.text)) fail('--text 只能是 edit、flow 或 image');
    if (flags.quality && !['std', 'small'].includes(flags.quality)) fail('--quality 只能是 std 或 small');
    if (flags.text) style.pptText = flags.text;
    if (flags.quality) style.pptQ = flags.quality;
    const setup = await app.run(`(()=>{
      window.confirm=()=>true;
      const st=${JSON.stringify(style)},ov={},bad=[];
      if(st.palette){const b=BIZ.find(b=>b[0]===st.palette);if(b){ov.color=b[1];ov.accent=b[2]}else bad.push('配色「'+st.palette+'」不存在')}
      for(const k of['color','accent','bg'])if(st[k]){if(HEXRE.test(st[k]))ov[k]=st[k];else bad.push(k+' 要寫成 #RRGGBB')}
      if(st.bg&&ov.bg)ov.bgOn=true;
      const fi=n=>FONTS.findIndex(f=>f[0].includes(n));
      if(st.font){const i=fi(st.font);if(i>=0)ov.tf=i;else bad.push('字體「'+st.font+'」不存在')}
      if(st.bodyFont){const i=fi(st.bodyFont);if(i>=0)ov.bf=i;else bad.push('字體「'+st.bodyFont+'」不存在')}
      if(st.fs)ov.fs=st.fs;
      if(st.pptText)ov.pptText=st.pptText;if(st.pptQ)ov.pptQ=st.pptQ;
      Object.assign(S,sanitise({...S,...ov}));
      /* 記下大綱裡不認得的版型名稱 */
      const orig=tplFrom,unknown=[];
      window.tplFrom=v=>{const r=orig(v);if(String(v||'').trim()&&!r)unknown.push(String(v).trim());return r};
      try{if(${!isPptx})importOutline(${JSON.stringify(md)},'replace')}finally{window.tplFrom=orig}
      return JSON.stringify({bad,unknown:[...new Set(unknown)]});
    })()`);
    const { bad, unknown } = JSON.parse(setup);
    let fromPptx = null;
    if (isPptx) {
      /* 既有 PPTX：在瀏覽器裡解析，頁面（與照片）直接放進頁面清單 */
      fromPptx = JSON.parse(await app.run(`(async()=>{const b=Uint8Array.from(atob(${JSON.stringify(pptxB64)}),c=>c.charCodeAt(0));
        const r=await pagesFromPptx(b,{withImages:${cmd !== 'from-pptx' && !flags['no-images']}});
        S.pages=r.pages.slice(0,MAXPAGES);usePage(0);drawLib();
        return JSON.stringify({charts:r.charts,images:r.images,outline:outlineOf(S.pages)})})()`));
    }
    if (cmd === 'from-pptx') {
      const file = resolve(flags.out || stem + '_大綱.md');
      writeFileSync(file, fromPptx.outline);
      const n = (fromPptx.outline.match(/^<!-- 第 \d+ 頁 -->$/gm) || []).length;
      out(`已轉成大綱：${file}（${n} 頁${fromPptx.charts ? `；${fromPptx.charts} 個圖表無法轉換` : ''}）`);
      app.close(); process.exit(0);
    }
    if (bad.length) fail(bad.join('；'));
    const report = JSON.parse(await app.run(`JSON.stringify(S.pages.map((p,i)=>{
      const svg=withState(ovOf(p),()=>renderSVG(TPLBY[p.tpl],imgsOf(p.sel,'thumb'),'c'+i+'_'));
      const msg=withState(ovOf(p),()=>overflowNote(svg)),m=msg.match(/⚠\\s*(.+?)\\s*超出/);
      return{page:i+1,tpl:p.tpl,name:TPLBY[p.tpl].name,title:p.title,notes:!!p.notes.trim(),overflow:m?m[1].split('、'):[],sample:TPLBY[p.tpl].cat!=='text'&&!p.sel.some(id=>lib.some(x=>x.id===id))};
    }))`));
    if (!report.length) fail('大綱裡沒有讀到任何頁面：每頁用「# 標題」開頭，或用 --- 分頁');
    const result = { pages: report.length, withNotes: report.filter(p => p.notes).length, unknownTemplates: unknown, overflow: report.filter(p => p.overflow.length).map(p => ({ page: p.page, tpl: p.tpl, fields: p.overflow, title: p.title })), files: {} };

    if (cmd === 'build') {
      const t0 = Date.now();
      const file = resolve(flags.out || stem + '.pptx');
      const b64 = await app.run(`(async()=>{const b=await buildPptx(await deckPages(),null);return (${B64})(new Uint8Array(await b.arrayBuffer()))})()`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, Buffer.from(b64, 'base64'));
      result.files.pptx = file; result.seconds = Math.round((Date.now() - t0) / 100) / 10;
    }
    if (cmd === 'preview') {
      const dir = resolve(flags.dir || stem + '_預覽');
      mkdirSync(dir, { recursive: true });
      result.files.png = [];
      for (const n of pageList(flags.pages || '1', report.length)) {
        const b64 = await app.run(`(async()=>{const p=S.pages[${n - 1}],im=await pageImages(p.sel);const svg=withState(ovOf(p),()=>renderSVG(TPLBY[p.tpl],im,'v_'));const b=await rasterizeSVG(svg,1,'image/png');return (${B64})(new Uint8Array(await b.arrayBuffer()))})()`);
        const f = join(dir, `p${String(n).padStart(2, '0')}.png`);
        writeFileSync(f, Buffer.from(b64, 'base64')); result.files.png.push(f);
      }
    }
    if (flags.project) {
      const file = resolve(flags.project);
      /* 與網頁版「專案存檔」同格式：各頁用到的圖（從 PPTX 帶進來的照片）一起存，sel 改成 images 的索引 */
      const j = await app.run(`(async()=>{storePage();
        const L=[...new Set(S.pages.flatMap(p=>p.sel))].map(id=>lib.find(x=>x.id===id)).filter(Boolean),at=new Map(L.map((it,i)=>[it.id,i]));
        const images=await Promise.all(L.map(async it=>({name:it.name,crop:it.crop,data:it.data||(it.data=await blobToData(it.blob))})));
        return JSON.stringify({app:'ppt-layout-generator',v:2,state:{...S,pages:S.pages.map(p=>({...p,sel:p.sel.filter(id=>at.has(id)).map(id=>at.get(id))}))},images})})()`);
      writeFileSync(file, j); result.files.project = file;
    }

    if (flags.json) out(JSON.stringify({ ...result, detail: report }, null, 1));
    else {
      const cnt = {}; for (const p of report) cnt[p.name] = (cnt[p.name] || 0) + 1;
      out(`共 ${result.pages} 頁，${result.withNotes} 頁有逐字稿`);
      out(`版型：${Object.entries(cnt).map(([k, v]) => `${k}×${v}`).join('、')}`);
      const samp = report.filter(p => p.sample).map(p => p.page);
      if (samp.length) out(`ℹ 第 ${samp.join('、')} 頁是照片版型（封面／章節等），目前沒有照片，會用示意風景圖；要放自己的照片請加 --project 再到網頁版換圖，或改用文字頁版型`);
      if (unknown.length) out(`⚠ 不認得的版型：${unknown.join('、')}（已依內容自動挑選；用 templates 指令看可用名稱）`);
      if (result.overflow.length) {
        out(`⚠ ${result.overflow.length} 頁文字放不下（多出來的不會出現在投影片上）：`);
        for (const o of result.overflow) out(`  第 ${o.page} 頁［${o.tpl}］${o.fields.join('、')}：${o.title}`);
        out('  建議：縮短文字、拆成兩頁，或換容量較大的版型（項目多用 tList，欄位多用 | 表格 |）');
      } else out('✓ 所有頁面的文字都放得下');
      if (result.files.pptx) out(`已產生：${result.files.pptx}（${result.seconds} 秒）`);
      if (result.files.png) out(`預覽：${result.files.png.join('\n      ')}`);
      if (result.files.project) out(`專案檔：${result.files.project}（網頁版「載入專案」可開啟微調）`);
    }
  }
} catch (e) {
  app.close(); fail(e.message);
}
app.close();
