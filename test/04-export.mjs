/* 匯出：PNG 尺寸、PPTX 結構（自己讀 ZIP 驗）、HTML 播放器 viewBox。
   下載走 CDP 的 download 目錄，驗完即刪。 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { test, ok, eq } from './lib/check.mjs';
import { checkPptx } from './lib/pptx.mjs';
import { removeTree } from './lib/fsx.mjs';

const wait = ms => new Promise(r => setTimeout(r, ms));

async function clearDownloads(dir) {
  for (const f of readdirSync(dir)) {
    try { removeTree(join(dir, f)); } catch { }
  }
}
async function waitForFile(dir, re, timeout = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const hit = readdirSync(dir).find(f => re.test(f) && !/\.crdownload$/.test(f));
    if (hit) {
      const path = join(dir, hit);
      const size = readFileSync(path).length;
      await wait(250);                       /* 等檔案寫完 */
      if (existsSync(path) && readFileSync(path).length === size && size > 0) return path;
    }
    await wait(200);
  }
  throw new Error('等不到下載檔案：' + re);
}

/* 依序切換四個尺寸，各自匯出單頁 PNG 與整份 PPTX */
const RATIOS = [['16:9', 1920, 1080], ['1:1', 1080, 1080], ['4:5', 1080, 1350], ['3:4', 1080, 1440], ['9:16', 1080, 1920]];

for (const [ratio, w, h] of RATIOS) {
  test(`PNG 匯出尺寸正確：${ratio}`, async ({ page, downloads }) => {
    await clearDownloads(downloads);
    await page.run(`(async()=>{
      const wait=ms=>new Promise(r=>setTimeout(r,ms));
      S.ratio=${JSON.stringify(ratio)};
      S.title='輸出測試';S.pages=[{...cleanPage({tpl:'tList',title:'輸出測試',items:'甲|a\\n乙|b'}),sel:[]}];
      S.cur=0;usePage(0);syncUI();drawAll();await wait(200);return 1;
    })()`);
    const msg = await page.run(`(async()=>{
      const wait=ms=>new Promise(r=>setTimeout(r,ms));
      document.getElementById('expBtn').click();await wait(80);
      const fmt=document.getElementById('fmt');fmt.value='png';fmt.dispatchEvent(new Event('change'));
      document.getElementById('dl').click();await wait(4000);
      return document.getElementById('toast').textContent;
    })()`);
    const file = await waitForFile(downloads, /\.png$/i);
    const buf = readFileSync(file);
    eq(buf.readUInt32BE(0), 0x89504e47, '不是 PNG');
    eq(buf.readUInt32BE(16), w * 2, 'PNG 寬');
    eq(buf.readUInt32BE(20), h * 2, 'PNG 高');
    ok(/2160|1080|3840|2700/i.test(msg) || msg.includes('已下載'), '下載提示：' + msg);
  });

  test(`PPTX 結構與投影片尺寸正確：${ratio}`, async ({ page, downloads, session }) => {
    await clearDownloads(downloads);
    await page.run(`(async()=>{
      const wait=ms=>new Promise(r=>setTimeout(r,ms));
      S.ratio=${JSON.stringify(ratio)};
      S.company='公司';S.date='2026.10';S.page='P.01';S.footer=true;
      S.pages=[
        {...cleanPage({tpl:'tList',title:'第一頁',items:'甲|a\\n乙|b',notes:'講稿內容'}),sel:[]},
        {...cleanPage({tpl:'tStats',title:'第二頁',items:'85%|滿意度|說明'}),sel:[]}
      ];
      S.cur=0;usePage(0);syncUI();drawAll();await wait(200);return 1;
    })()`);
    await page.run(`(async()=>{
      const wait=ms=>new Promise(r=>setTimeout(r,ms));
      document.getElementById('expBtn').click();await wait(80);
      const fmt=document.getElementById('fmt');fmt.value='pptx';fmt.dispatchEvent(new Event('change'));
      document.getElementById('deckOut').click();await wait(9000);
      return document.getElementById('toast').textContent;
    })()`);
    const file = await waitForFile(downloads, /\.pptx$/i);
    const res = checkPptx(readFileSync(file), { px: [w, h], minSlides: 2 });
    eq(res.problems.length, 0, 'PPTX 問題：\n      ' + res.problems.join('\n      '));
    eq(res.slides, 2, '投影片張數');
    ok(res.runs >= 4, '可編輯文字太少：' + res.runs);
    ok(res.media >= 1, '沒有內嵌圖片');
  });
}

test('HTML 播放器帶正確的 viewBox 與逐字稿', async ({ page, downloads }) => {
  await clearDownloads(downloads);
  await page.run(`(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    S.ratio='3:4';
    S.pages=[{...cleanPage({tpl:'kPhoto',title:'播放測試',notes:'這頁的講稿'}),sel:[]}];
    S.cur=0;usePage(0);syncUI();drawAll();await wait(200);return 1;
  })()`);
  await page.run(`(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    document.getElementById('expBtn').click();await wait(80);
    document.getElementById('htmlOut').click();await wait(6000);
    return document.getElementById('toast').textContent;
  })()`);
  const file = await waitForFile(downloads, /\.html$/i);
  const html = readFileSync(file, 'utf8');
  /* 投影片 SVG 是嵌在 JS 字串裡的，viewBox 的引號會被跳脫，所以直接比對畫布尺寸字串 */
  ok(html.includes('0 0 1080 1440'), '播放器沒有用 3:4 的畫布（找不到 0 0 1080 1440）');
  ok(!html.includes('0 0 1080 1920'), '播放器混進了 9:16 的畫布');
  ok(/aspect-ratio/.test(html), '播放器沒有鎖住畫面比例');
  ok(html.includes('這頁的講稿'), '逐字稿沒有寫進播放器');
  ok(!/https?:\/\/(?!www\.w3\.org)/.test(html.replace(/<svg[\s\S]*?<\/svg>/g, '')), '播放器不該連外部網址');
});
