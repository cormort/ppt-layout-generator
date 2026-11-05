/* 功能區（Ribbon）：按鈕只是轉呼叫既有控制項，所以「指到不存在的東西」不會報錯、只會安安靜靜沒反應。
   這支把每個 data-* 都對回真正的元素，再實際點幾個按鈕確認真的會動。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';

test('功能區：每個 data-do／data-tab／data-cat／data-focus／data-fn／data-view 都指到真的東西', async ({ page }) => {
  const got = await page.run(`(()=>{
    const q=s=>[...document.querySelectorAll(s)];
    const ids=new Set([...document.querySelectorAll('[id]')].map(e=>e.id));
    const tabs=new Set(q('.itabs [data-tab]').map(b=>b.dataset.tab));
    const cats=new Set(CATS.map(c=>c[0]));
    const bad=[];
    for(const b of q('[data-do]'))if(!ids.has(b.dataset.do))bad.push('data-do="'+b.dataset.do+'" 沒有對應的元素');
    for(const b of q('[data-focus]'))if(!ids.has(b.dataset.focus))bad.push('data-focus="'+b.dataset.focus+'" 沒有對應的元素');
    for(const b of q('[data-tab]'))if(b.closest('#ribbon')&&!tabs.has(b.dataset.tab))bad.push('data-tab="'+b.dataset.tab+'" 不是右側窗格的分頁');
    for(const b of q('#ribbon [data-cat]'))if(!cats.has(b.dataset.cat))bad.push('data-cat="'+b.dataset.cat+'" 不是分類');
    for(const b of q('[data-fn]'))if(typeof RIB_FN[b.dataset.fn]!=='function')bad.push('data-fn="'+b.dataset.fn+'" 沒有實作');
    for(const b of q('[data-view]'))if(!(b.dataset.view in VIEW))bad.push('data-view="'+b.dataset.view+'" 不是可切換的窗格');
    for(const b of q('#rtabs [data-rt]'))if(!document.querySelector('.rp[data-rp="'+b.dataset.rt+'"]'))bad.push('data-rt="'+b.dataset.rt+'" 沒有對應的功能區頁面');
    for(const b of q('[data-suite]'))if(!SUITEBY[b.dataset.suite])bad.push('data-suite="'+b.dataset.suite+'" 沒有這套');
    for(const b of q('[data-theme]'))if(!THEMES.some(t=>t[0]===b.dataset.theme))bad.push('data-theme="'+b.dataset.theme+'" 沒有這個外觀');
    return {bad,must:{ihd:!!document.querySelector('.ihd'),status:!!document.getElementById('status'),
      stSlide:!!document.getElementById('stSlide'),stRatio:!!document.getElementById('stRatio'),
      rRatio:!!document.getElementById('rRatio'),rSuite:!!document.getElementById('rSuite'),rTheme:!!document.getElementById('rTheme'),
      ribbon:!!document.getElementById('ribbon'),rtabs:!!document.getElementById('rtabs')}};
  })()`);
  deepEq(got.bad, [], '功能區有指到不存在的東西：\n      ' + got.bad.join('\n      '));
  for (const [k, v] of Object.entries(got.must)) ok(v, '缺少元素：' + k);
});

test('功能區：按鈕真的會動（新增投影片、換分頁、套裝、窗格開關）', async ({ page }) => {
  const got = await page.run(`(()=>{
    const q=s=>document.querySelector(s);
    const s0=S.pages.length;
    q('#ribbon [data-fn="add"]').click();
    const added=S.pages.length;
    q('#ribbon [data-tab="photo"]').click();
    const tab=q('.itabs button[data-tab="photo"]').getAttribute('aria-selected');
    const tool_on=q('#filters')?'ok':'ok';
    q('#ribbon [data-suite="annual"]').click();
    const suite=[S.color,S.accent];
    const before=document.body.classList.contains('no-notes');
    q('#status [data-view="notes"]').click();
    const after=document.body.classList.contains('no-notes');
    q('#status [data-view="notes"]').click();
    q('#ribbon [data-fn="del"]').click();
    return {s0,added,tab,suite,before,after,back:S.pages.length};
  })()`);
  eq(got.added, got.s0 + 1, '新增投影片沒反應');
  eq(got.tab, 'true', '切到照片分頁沒反應');
  deepEq(got.suite, ['#1f3a5f', '#c9a24a'], '套裝按鈕沒套用');
  ok(got.before !== got.after, '備忘稿窗格開關沒反應');
  eq(got.back, got.s0, '刪除投影片沒反應');
});

test('功能區：桌面才有、手機不會擠壞（手機維持原本的分頁列）', async ({ page }) => {
  await page.viewport(1440, 900, false);
  const desk = await page.run(`(()=>{const r=document.getElementById('ribbon').getBoundingClientRect();
    return {h:Math.round(r.height),w:Math.round(r.width),vis:getComputedStyle(document.getElementById('ribbon')).display!=='none'}})()`);
  ok(desk.vis, '桌面版看不到功能區');
  ok(desk.h > 40 && desk.h < 200, '功能區高度不對：' + desk.h);
  await page.viewport(390, 844, true);
  const mob = await page.run(`(()=>{const r=document.getElementById('ribbon').getBoundingClientRect();
    const s=document.getElementById('status').getBoundingClientRect();
    return {rib:Math.round(r.height),status:Math.round(s.height)}})()`);
  eq(mob.rib, 0, '手機版不該出現功能區（高度 ' + mob.rib + '）');
  eq(mob.status, 0, '手機版不該出現狀態列（高度 ' + mob.status + '）');
  await page.viewport(1720, 1200, false);
});

test('功能區：視窗變窄時會提示「還有更多」，並能捲過去', async ({ page }) => {
  /* 1100px 以下「常用」還會溢出；1200 以上收緊後就放得下了（下一條測試驗這件事） */
  await page.viewport(920, 860, false);
  await page.run('new Promise(r=>setTimeout(r,150))');
  const got = await page.run(`(async()=>{
    const rb=document.getElementById('rbody'),more=document.getElementById('ribMore'),rib=document.getElementById('ribbon');
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const narrow={over:rib.classList.contains('over'),moreHidden:more.hidden,canScroll:rb.scrollWidth>rb.clientWidth+2,left:rb.scrollLeft};
    more.click();await wait(500);
    const afterScroll={left:Math.round(rb.scrollLeft),over:rib.classList.contains('over')};
    return {narrow,afterScroll};
  })()`);
  ok(got.narrow.canScroll, '920px 下功能區應該需要橫向捲動');
  eq(got.narrow.moreHidden, false, '有溢出時「»」按鈕要出現');
  eq(got.narrow.over, true, '有溢出時要顯示右側渐層');
  ok(got.afterScroll.left > got.narrow.left + 80, '按「»」要真的捲過去：' + got.afterScroll.left);

  /* 夠寬時不該有提示 */
  await page.viewport(2200, 1200, false);
  await page.run('new Promise(r=>setTimeout(r,300))');
  const wide = await page.run(`(()=>{const rb=document.getElementById('rbody');
    return {over:document.getElementById('ribbon').classList.contains('over'),moreHidden:document.getElementById('ribMore').hidden,
      canScroll:rb.scrollWidth>rb.clientWidth+2}})()`);
  eq(wide.moreHidden, true, '夠寬時不該出現「»」按鈕');
  eq(wide.over, false, '夠寬時不該有渐層');
  await page.viewport(1720, 1200, false);
});

test('功能區：1200px 收緊後「常用」不需要橫向捲動', async ({ page }) => {
  await page.viewport(1200, 860, false);
  await page.run('new Promise(r=>setTimeout(r,200))');
  const got = await page.run(`(()=>{
    const rb=document.getElementById('rbody');
    document.getElementById('rtabs').querySelector('[data-rt="home"]').click();
    const home=rb.scrollWidth-rb.clientWidth;
    document.getElementById('rtabs').querySelector('[data-rt="insert"]').click();
    const insert=rb.scrollWidth-rb.clientWidth;
    document.getElementById('rtabs').querySelector('[data-rt="home"]').click();
    return {home,insert,font:getComputedStyle(rb.querySelector('.rb')).fontSize};
  })()`);
  ok(got.home <= 2, '「常用」在 1200px 還需要捲動 ' + got.home + 'px');
  ok(got.insert <= 2, '「插入」在 1200px 還需要捲動 ' + got.insert + 'px');
  eq(got.font, '12px', '窄桌面應該把功能區字級收到 12px（實際 ' + got.font + '）');
  await page.viewport(1720, 1200, false);
});

test('功能區：Alt+數字與 ←/→ 可以切分頁', async ({ page }) => {
  const got = await page.run(`(()=>{
    const key=(k,o={})=>document.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true,...o}));
    const cur=()=>[...document.getElementById('rtabs').children].find(b=>b.classList.contains('on')).dataset.rt;
    key('3',{altKey:true});const a=cur();
    key('5',{altKey:true});const b=cur();
    /* 分頁列有焦點時用方向鍵 */
    const list=[...document.getElementById('rtabs').children];
    list[4].focus();
    list[4].dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    const c=cur();
    list[5].dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));
    const d=cur();
    const tabindex=list.map(b=>b.getAttribute('tabindex')).join('');
    return {a,b,c,d,tabindex};
  })()`);
  eq(got.a, 'design', 'Alt+3 沒切到「設計」');
  eq(got.b, 'export', 'Alt+5 沒切到「匯出」');
  eq(got.c, 'view', '→ 沒往後一格（從「匯出」到「檢視」）');
  eq(got.d, 'home', 'Home 沒回到第一個');
  ok(/^(-1)+(0)(-1)*$/.test(got.tabindex) || got.tabindex.split('').filter(x => x === '0').length === 1, '分頁應該只有一個 tabindex=0（roving）：' + got.tabindex);
});

test('自訂套裝：存起來、列得出來、套得上去、刪得掉', async ({ page }) => {
  const got = await page.run(`(()=>{
    localStorage.removeItem('lgSuites');
    S.ratio='16:9';
    S.pages=[cleanPage({tpl:'cFrame',title:'封面',body:'',items:''}),
      cleanPage({tpl:'bignum',title:'章',number:'01',body:'',items:''}),
      cleanPage({tpl:'tList',title:'重點',body:'',items:'甲|說明'}),
      cleanPage({tpl:'thanks',title:'謝謝',body:'',items:''})];
    S.cur=0;S.color='#123456';S.accent='#fedcba';S.tf=3;S.bf=2;
    const su=saveCurrentAsSuite('我的測試');
    const listed=allSuites().map(s=>s.id).includes(su.id);
    const found=suiteFrom('我的測試');
    /* 改掉樣式再套回來 */
    S.color='#000000';S.accent='#111111';
    const n=applySuite(su.id);
    const applied={color:S.color,accent:S.accent,tf:S.tf,bf:S.bf,tpls:S.pages.map(p=>p.tpl)};
    const del=deleteSuite(su.id);
    return {id:su.id,listed,found:found&&found.id,applied,n,left:allSuites().filter(s=>s.id===su.id).length,afterDel:del};
  })()`);
  ok(got.listed, '存完之後清單裡沒有它');
  eq(got.found, got.id, '用中文名找不到自訂套裝');
  deepEq([got.applied.color, got.applied.accent, got.applied.tf, got.applied.bf], ['#123456', '#fedcba', 3, 2], '自訂套裝的配色字型不對');
  /* 章節頁（bignum）沒有照片，套用時會換成不需要照片的 secPlain */
  deepEq(got.applied.tpls, ['cFrame', 'secPlain', 'tList', 'thanks'], '自訂套裝套用後的版型');
  eq(got.left, 0, '刪不掉自訂套裝');
});
