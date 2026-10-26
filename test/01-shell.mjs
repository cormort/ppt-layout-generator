/* 外殼：載入無錯誤、每個 $('id') 都找得到、比例按鈕齊全、手機觸控目標。 */
import { test, ok, eq, noErrors } from './lib/check.mjs';

test('載入後沒有 console 錯誤或例外', async ({ page }) => {
  const info = await page.run(`(()=>({ready:document.readyState,tpl:TPL.length,title:document.title}))()`);
  eq(info.ready, 'complete', 'readyState');
  ok(info.tpl > 40, '範本數量太少：' + info.tpl);
  noErrors(page.errors());
});

test('程式碼裡用到的每個元素 id 都存在（播放器／簡報者檢視的是產生出來的）', async ({ page }) => {
  /* 先產生「匯出檔／簡報者視窗」用的 HTML，收集它自己的 id；這段會動到 DOM，所以要重載後再檢查 */
  const gen = await page.run(`(async()=>{
    let g='';
    try{g+=playerHtml(await deckSlides(),{title:'t'})}catch(e){}
    try{g+=PRESENTER()}catch(e){}
    return g;
  })()`);
  /* 匯出檔裡的 id 可能是字串內的字面值（簡報者檢視的 HTML 是嵌在 JS 字串裡），所以連 \" 也要吃 */
  const genIds = new Set();
  for (const m of String(gen).matchAll(/id=(?:\\?"|\\?')([A-Za-z0-9_-]+)/g)) genIds.add(m[1]);
  await page.reload();
  const got = await page.run(`(()=>{
    const code=[...document.querySelectorAll('script')].map(s=>s.textContent||'').join('\\n');
    const ids=new Set();
    for(const m of code.matchAll(/\\$\\('([A-Za-z0-9_-]+)'\\)/g))ids.add(m[1]);
    for(const m of code.matchAll(/getElementById\\('([A-Za-z0-9_-]+)'\\)/g))ids.add(m[1]);
    return [...ids].map(id=>[id,!!document.getElementById(id)]);
  })()`);
  const missing = got.filter(([id, present]) => !present && !genIds.has(id)).map(([id]) => id);
  eq(missing.length, 0, '找不到的 id：' + missing.join(', '));
});

test('版面尺寸按鈕與 RATIOS 一致', async ({ page }) => {
  const got = await page.run(`(()=>({
    keys:Object.keys(RATIOS),
    btns:[...document.getElementById('ratioSeg').children].map(b=>b.dataset.v)
  }))()`);
  eq(got.btns.join(','), got.keys.join(','), '比例按鈕順序');
  ok(got.keys.includes('3:4'), '缺少 3:4');
});

test('手機寬度沒有小於 44px 的主要按鈕（.btn 不含 .mini）', async ({ page }) => {
  await page.viewport(390, 844, true);
  const small = await page.run(`(()=>{
    const out=[];
    for(const el of document.querySelectorAll('button')){
      const r=el.getBoundingClientRect();
      if(!r.width||!r.height)continue;
      if(el.classList.contains('mini')||el.classList.contains('fix'))continue;
      if(el.closest('.ied'))continue;               /* 項目列的 ↑↓✕ 是刻意的緊湊尺寸 */
      if(r.height<43.5)out.push((el.id||el.textContent.trim().slice(0,8))+':'+Math.round(r.height));
    }
    return out;
  })()`);
  eq(small.length, 0, '太小的按鈕：' + small.join(', '));
  await page.viewport(1720, 1200, false);
});

test('每個分類都有版型，而且分類鍵都對得上', async ({ page }) => {
  const got = await page.run(`(()=>{
    const by={};for(const t of TPL)by[t.cat]=(by[t.cat]||0)+1;
    const catKeys=CATS.filter(([k])=>k!=='fit'&&k!=='all').map(([k])=>k);
    return {by,catKeys,unknown:Object.keys(by).filter(k=>!catKeys.includes(k))};
  })()`);
  for (const k of got.catKeys) ok(got.by[k] > 0, `分類 ${k} 沒有任何版型`);
  eq(got.unknown.length, 0, '有版型用了未宣告的分類：' + got.unknown.join(', '));
});
